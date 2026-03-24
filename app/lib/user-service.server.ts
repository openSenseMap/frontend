import bcrypt from 'bcryptjs'
import { and, eq, gt, isNull } from 'drizzle-orm'
import ConfirmEmailAddress, {
	subject as ConfirmEmailAddressSubject,
} from 'emails/confirm-email'
import DeleteUserEmail, {
	subject as DeleteUserEmailSubject,
} from 'emails/delete-user'
import NewUserEmail, { subject as NewUserEmailSubject } from 'emails/new-user'
import PasswordResetEmail, {
	subject as PasswordResetEmailSubject,
} from 'emails/password-reset'
import {	subject as ResendEmailConfirmationSubject } from 'emails/resend-email-confirmation'
import invariant from 'tiny-invariant'
import { createToken, revokeToken } from './jwt'

import { sendMail } from './mail.server'
import {
	validateEmail,
	validatePassword,
	validateTosAccepted,
	validateUsername,
} from './user-service'
import { drizzleClient } from '~/db.server'
import { generateRawActionToken, hashActionToken, issueEmailConfirmationToken } from '~/models/token.server'
import { getCurrentEffectiveTos } from '~/models/tos.server'
import {
	createUser,
	deleteUserByEmail,
	getUserByEmail,
	getUserById,
	getUserByUsername,
	preparePasswordHash,
	updateUserEmail,
	updateUserlocale,
	updateUserName,
	updateUserPassword,
	verifyLogin,
} from '~/models/user.server'
import { actionToken, user, type User } from '~/schema'

const ONE_HOUR_MILLIS: number = 60 * 60 * 1000

type RegisterUserResult =
	| { ok: true; user: User }
	| {
			ok: false
			field: 'username' | 'email' | 'password' | 'tos' | 'form'
			code:
				| 'username_required'
				| 'username_length'
				| 'username_invalid'
				| 'username_already_taken'
				| 'email_required'
				| 'email_invalid'
				| 'email_already_taken'
				| 'password_required'
				| 'password_too_short'
				| 'password_too_weak'
        | 'tos_required'
				| 'registration_failed'
	  }
/**
 * Register a new user with the database.
 * @param {string} username Username for the new user profile
 * @param {string} email Email address for the new profile
 * @param {string} password Password for the new profile
 * @param language Language as IETF BCP 47 (e.g. de_DE)
 * @returns If successful, the new user profile is returned. If unsuccessful a validation object
 * is returned that indicates what is wrong with the request. Null is returned when the user profile
 * with the given email already exists.
 */
export const registerUser = async (
	username: string,
	email: string,
	password: string,
	language: 'de_DE' | 'en_US',
  tosAccepted: boolean
): Promise<RegisterUserResult> => {
	const normalizedUsername = username.trim()
	const normalizedEmail = email.trim().toLowerCase()

	const usernameValidation = validateUsername(normalizedUsername)
	if (!usernameValidation.isValid) {
		return {
			ok: false,
			field: 'username',
			code: usernameValidation.required
				? 'username_required'
				: usernameValidation.length
					? 'username_length'
					: usernameValidation.invalidCharacters
						? 'username_invalid'
						: 'registration_failed',
		}
	}

	const existingUserByUsername = await getUserByUsername(normalizedUsername)
	if (existingUserByUsername) {
		return {
			ok: false,
			field: 'username',
			code: 'username_already_taken',
		}
	}

	const emailValidation = validateEmail(normalizedEmail)
	if (!emailValidation.isValid) {
		return {
			ok: false,
			field: 'email',
			code: emailValidation.required ? 'email_required' : 'email_invalid',
		}
	}

	const existingUserByEmail = await getUserByEmail(normalizedEmail)
	if (existingUserByEmail) {
		return {
			ok: false,
			field: 'email',
			code: 'email_already_taken',
		}
	}

	const passwordValidation = validatePassword(password)
	if (!passwordValidation.isValid) {
		return {
			ok: false,
			field: 'password',
			code: passwordValidation.required
					? 'password_required'
					: passwordValidation.length
						? 'password_too_short'
						: passwordValidation.complexity
							? 'password_too_weak'
							: 'registration_failed',
						}
	}

  const tosValidation = validateTosAccepted(tosAccepted)
  if (!tosValidation.isValid) {
    return {
      ok: false,
      field: 'tos',
      code: 'tos_required',
    }
  }

	const tos = await getCurrentEffectiveTos()
	invariant(tos, 'Expected tos to be configured.')

	const newUsers = await createUser(
		normalizedUsername,
		normalizedEmail,
		language,
		password,
    tos.id
	)

	if (newUsers.length === 0) {
		return {
			ok: false,
			field: 'form',
			code: 'registration_failed',
		}
	}

  invariant(
    newUsers.length === 1,
    'Expected to only get a single user account returned',
  )

	const newUser = newUsers[0]
	const lng = (newUser.language?.split('_')[0] as 'de' | 'en') ?? 'en'

  const token = await issueEmailConfirmationToken(newUser.id)

	await sendMail({
		recipientAddress: newUser.email,
		recipientName: newUser.name,
		subject: NewUserEmailSubject[lng],
		body: NewUserEmail({
			user: { name: newUser.name },
			email: newUser.email,
			token,
			language: lng,
		}),
	})

	return {
		ok: true,
		user: newUser,
	}
}	  

/**
 * Updates an existing user setting using the provided properties given to this function.
 * The response contains a messages array that collects a message per updated property.
 * Additionally the user is signed out when the password is changed. This is reflected
 * in the response object as well.
 * @param user The user to update
 * @param details An object containing the user details to update
 * @returns An object indicating whether the user profile has been changed, if the user is signed out and what
 * messages have been produced during the update procedure (e.g. for each field updated).
 */
export const updateUserDetails = async (
  user: User,
  jwtString: string,
  details: {
    email?: string
    language?: 'de_DE' | 'en_US'
    name?: string
    currentPassword?: string
    newPassword?: string
  },
): Promise<{
  updated: boolean
  signOut: boolean
  messages: string[]
  updatedUser: User
}> => {
  const { email, language, name, currentPassword, newPassword } = details
  const messages: string[] = []

  if (email && newPassword) {
    messages.push(
      'You cannot change your email address and password in the same request.',
    )
    return {
      updated: false,
      signOut: false,
      messages,
      updatedUser: user,
    }
  }

  if ((newPassword && newPassword !== '') || (email && email !== '')) {
    if (!currentPassword) {
      messages.push(
        'To change your password or email address, please supply your current password.',
      )
      return {
        updated: false,
        signOut: false,
        messages,
        updatedUser: user,
      }
    }

    const login = await verifyLogin(user.email, currentPassword)
    if (login === null) {
      messages.push('Password incorrect')
      return {
        updated: false,
        signOut: false,
        messages,
        updatedUser: user,
      }
    }

    if (newPassword && validatePassword(newPassword).isValid === false) {
      messages.push('New password should have at least 8 characters')
      return {
        updated: false,
        signOut: false,
        messages,
        updatedUser: user,
      }
    }
  }

  if (email && !validateEmail(email).isValid) {
    messages.push('Invalid email address')
    return {
      updated: false,
      signOut: false,
      messages,
      updatedUser: user,
    }
  }

  if (name && !validateUsername(name).isValid) {
    messages.push('Invalid username')
    return {
      updated: false,
      signOut: false,
      messages,
      updatedUser: user,
    }
  }

  let signOut = false
  let hasChanges = false

  if (name && user.name !== name) {
    await updateUserName(user.email, name)
    messages.push('Name changed.')
    hasChanges = true
  }

  if (language && user.language !== language) {
    await updateUserlocale(user.email, language)
    messages.push('Language changed.')
    hasChanges = true
  }

  if (email && user.email !== email) {
    await updateUserEmail(user, email)

    const token = await issueEmailConfirmationToken(user.id)
    const effectiveLanguage = (language ?? user.language)?.split('_')[0] as 'de' | 'en' | undefined
    const lng = effectiveLanguage ?? 'en'

    await sendMail({
      recipientAddress: email,
      recipientName: name ?? user.name,
      subject: ConfirmEmailAddressSubject[lng],
      body: ConfirmEmailAddress({
        user: { name: name ?? user.name },
        email,
        token,
        language: lng,
      }),
    })

    messages.push(
      'E-Mail changed. Please confirm your new address. Until confirmation, sign in using your old address',
    )
    hasChanges = true
  }

  if (newPassword) {
    await updateUserPassword(user.id, newPassword)
    await revokeToken(user, jwtString)
    messages.push('Password changed. Please sign in with your new password')
    signOut = true
    hasChanges = true
  }

  if (hasChanges) {
    const updatedUser = await getUserById(user.id)
    return {
      updated: true,
      signOut,
      messages,
      updatedUser: updatedUser ?? user,
    }
  }

  return {
    updated: false,
    messages: [],
    signOut: false,
    updatedUser: user,
  }
}

/**
 * Deletes a user account after verifiying that the user is entitled by checking
 * the password and revoking the token.
 * @param user The user to delete
 * @param password The users password to verify in addition to the jwt
 * @param jwtString The jwt token to revoke prior to deletion
 * @returns True if the user was deleted, otherwise false or "unauthorized"
 * if the user is not entitle to delete with the given parameters
 */
export const deleteUser = async (
	user: User,
	password: string,
	jwtString: string,
): Promise<boolean | 'unauthorized'> => {
	const verifiedUser = await verifyLogin(user.email, password)
	if (verifiedUser === null) return 'unauthorized'
	await revokeToken(user, jwtString)
	const userSuccessfullyDeleted =
		(await deleteUserByEmail(user.email)).count > 0

	const lng = (verifiedUser.language?.split('_')[0] as 'de' | 'en') ?? 'en'
	await sendMail({
		recipientAddress: verifiedUser.email,
		recipientName: verifiedUser.name,
		subject: DeleteUserEmailSubject[lng],
		body: DeleteUserEmail({
			user: { name: verifiedUser.name },
			language: lng,
		}),
	})

	return userSuccessfullyDeleted
}

/**
 * Confirms a user's email address by validating the raw token sent to them and updating
 * their profile on success.
 * @param rawToken Raw token sent to the user via email to the to-be-confirmed address
 * @returns 'success' | 'forbidden' (invalid/already consumed token) | 'expired'
 */
export const confirmEmail = async (
  rawToken: string,
): Promise<'forbidden' | 'expired' | 'success'> => {
  const now = new Date()
  const tokenHash = hashActionToken(rawToken)

  const token = await drizzleClient.query.actionToken.findFirst({
    where: (t, { and, eq }) =>
      and(
        eq(t.purpose, 'email_confirmation'),
        eq(t.tokenHash, tokenHash),
      ),
  })

  if (!token) return 'forbidden'
  if (token.consumedAt) return 'forbidden'
  if (now.getTime() > token.expiresAt.getTime()) return 'expired'

  return drizzleClient.transaction(async (tx) => {
    const consumed = await tx
      .update(actionToken)
      .set({ consumedAt: now })
      .where(
        and(
          eq(actionToken.id, token.id),
          isNull(actionToken.consumedAt),
          gt(actionToken.expiresAt, now),
        ),
      )
      .returning({
        userId: actionToken.userId,
      })

    const consumedToken = consumed[0]
    if (!consumedToken) return 'forbidden' as const

    const currentUser = await tx.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, consumedToken.userId),
      columns: {
        id: true,
        email: true,
        unconfirmedEmail: true,
        emailIsConfirmed: true,
      },
    })

    if (!currentUser) return 'forbidden' as const

    const pendingEmail = currentUser.unconfirmedEmail?.trim()

    if (pendingEmail) {
      await tx
        .update(user)
        .set({
          email: pendingEmail.toLowerCase(),
          unconfirmedEmail: null,
          emailIsConfirmed: true,
          updatedAt: now,
        })
        .where(eq(user.id, currentUser.id))
    } else {
      await tx
        .update(user)
        .set({
          emailIsConfirmed: true,
          updatedAt: now,
        })
        .where(eq(user.id, currentUser.id))
    }

    return 'success' as const
  })
}

/**
 * Initiates a password request for the user with the given email address.
 * Overwrites existing requests.
 * @param email The email address to request a password reset for
 */
export const requestPasswordReset = async (email: string) => {
	const user = await drizzleClient.query.user.findFirst({
		where: (user, { eq }) => eq(user.email, email.toLowerCase()),
	})

	if (!user) return

	const rawToken = generateRawActionToken()
  	const tokenHash = hashActionToken(rawToken)
	await drizzleClient
		.insert(actionToken)
		.values({
		userId: user.id,
		purpose: 'password_reset',
		tokenHash,
		expiresAt: new Date(Date.now() + 12 * ONE_HOUR_MILLIS),
		consumedAt: null,
		})
		.onConflictDoUpdate({
		target: [actionToken.userId, actionToken.purpose],
		set: {
			tokenHash,
			expiresAt: new Date(Date.now() + 12 * ONE_HOUR_MILLIS),
			consumedAt: null,
		},
		})

	const lng = (user.language?.split('_')[0] as 'de' | 'en') ?? 'en'
	await sendMail({
		recipientAddress: user.email,
		recipientName: user.name,
		subject: PasswordResetEmailSubject[lng],
		body: PasswordResetEmail({
			user: { email: user.email, name: user.name },
			token: rawToken,
			language: lng,
		}),
	})
}

/**
 * Resets a user's password using a password-reset token received by email.
 */
export const resetPassword = async (
  passwordResetToken: string,
  newPassword: string,
): Promise<'forbidden' | 'expired' | 'invalid_password_format' | 'success'> => {
  const now = new Date()
  const tokenHash = hashActionToken(passwordResetToken)

  const token = await drizzleClient.query.actionToken.findFirst({
    where: (t, { and, eq }) =>
      and(
        eq(t.purpose, 'password_reset'),
        eq(t.tokenHash, tokenHash),
      ),
  })

  if (!token) return 'forbidden'
  if (token.consumedAt) return 'forbidden'
  if (now.getTime() > token.expiresAt.getTime()) return 'expired'

  if (validatePassword(newPassword).isValid === false) {
    return 'invalid_password_format'
  }

  const result = await drizzleClient.transaction(async (tx) => {
    const consumed = await tx
      .update(actionToken)
      .set({ consumedAt: now })
      .where(
        and(
          eq(actionToken.id, token.id),
          isNull(actionToken.consumedAt),
          gt(actionToken.expiresAt, now),
        ),
      )
      .returning({
        userId: actionToken.userId,
      })

    const consumedToken = consumed[0]
    if (!consumedToken) return 'forbidden' as const

    const updated = await updateUserPassword(consumedToken.userId, newPassword)

    invariant(updated.length === 1)

    // TODO: invalidate refreshToken and active accessTokens

    return 'success' as const
  })

  return result
}

/**
 * Resends the email confirmation for the given user again.
 * This resets the existing confirmation token for that user/purpose.
 */
export const resendEmailConfirmation = async (
  u: User,
): Promise<'already_confirmed' | User> => {
  const pendingEmail = (u.unconfirmedEmail ?? '').trim()
  const hasPending = pendingEmail.length > 0

  if (u.emailIsConfirmed && !hasPending) return 'already_confirmed'

  const token = await issueEmailConfirmationToken(u.id)

  const lng = (u.language?.split('_')[0] as 'de' | 'en') ?? 'en'
  const recipient = hasPending ? pendingEmail : u.email

  await sendMail({
    recipientAddress: recipient,
    recipientName: u.name,
    subject: ResendEmailConfirmationSubject[lng],
    body: ConfirmEmailAddress({
      user: { name: u.name },
      email: recipient,
      token,
      language: lng,
    }),
  })

  return u
}

export const signIn = async (
	emailOrName: string,
	password: string,
): Promise<{ user: User; jwt: string; refreshToken: string } | null> => {
	const user = await drizzleClient.query.user.findFirst({
		where: (user, { eq, or }) =>
			or(eq(user.email, emailOrName.toLowerCase()), eq(user.name, emailOrName)),
		with: {
			password: true,
		},
	})
	if (!user) return null

	const correctPassword = await bcrypt.compare(
		preparePasswordHash(password),
		user.password.hash,
	)
	if (!correctPassword) return null

	const { token, refreshToken } = await createToken(user)
	return { user, jwt: token, refreshToken }
}

export const userNameToURl = (username: string): string => encodeURIComponent(username);
export const userNameFromURl = (username: string): string => decodeURIComponent(username);

