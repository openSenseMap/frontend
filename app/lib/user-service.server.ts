import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { createToken, revokeToken } from "./jwt";

import {
  type EmailValidation,
  type PasswordValidation,
  type UsernameValidation,
  validateEmail,
  validatePassword,
  validateUsername,
} from "./user-service";
import { drizzleClient } from "~/db.server";
import {
  createUser,
  deleteUserByEmail,
  getUserByEmail,
  preparePasswordHash,
  updateUserEmail,
  updateUserlocale,
  updateUserName,
  updateUserPassword,
  verifyLogin,
} from "~/models/user.server";
import { passwordResetRequest, user, type User } from "~/schema";

const ONE_HOUR_MILLIS: number = 60 * 60 * 1000;

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
  language: "de_DE" | "en_US",
): Promise<
  UsernameValidation | EmailValidation | PasswordValidation | User | null
> => {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) return usernameValidation;

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;

  const existingUser = await getUserByEmail(email);
  if (existingUser) return null; // no new user is created -> null

  const newUsers = await createUser(username, email, language, password);
  if (newUsers.length === 0)
    throw new Error("Something went wrong creating the user profile!");

  invariant(
    newUsers.length === 1,
    "Expected to only get a single user account returned",
  );
  return newUsers[0];
};

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
    email?: string;
    language?: "de_DE" | "en_US";
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<{
  updated: boolean;
  signOut: boolean;
  messages: string[];
  updatedUser: User;
}> => {
  const { email, language, name, currentPassword, newPassword } = details;
  const messages = [];

  // don't allow email and password change in one request
  if (email && newPassword) {
    messages.push(
      "You cannot change your email address and password in the same request.",
    );
    return {
      updated: false,
      signOut: false,
      messages: messages,
      updatedUser: user,
    };
  }

  // for password and email changes, require parameter currentPassword to be valid
  if ((newPassword && newPassword !== "") || (email && email !== "")) {
    if (!currentPassword) {
      messages.push(
        "To change your password or email address, please supply your current password.",
      );
      return {
        updated: false,
        signOut: false,
        messages: messages,
        updatedUser: user,
      };
    }

    const login = await verifyLogin(user.email, currentPassword);
    if (login === null) {
      messages.push("Password incorrect");
      return {
        updated: false,
        signOut: false,
        messages: messages,
        updatedUser: user,
      };
    }

    if (newPassword && validatePassword(newPassword).isValid === false) {
      messages.push("New password should have at least 8 characters");
      return {
        updated: false,
        signOut: false,
        messages: messages,
        updatedUser: user,
      };
    }
  }

  // If specified, make sure the email is valid
  if (email && !validateEmail(email).isValid) {
    messages.push("Invalid email address");
    return {
      updated: false,
      signOut: false,
      messages: messages,
      updatedUser: user,
    };
  }

  // If specified, make sure the username is valid
  if (name && !validateUsername(name).isValid) {
    messages.push("Invalid username");
    return {
      updated: false,
      signOut: false,
      messages: messages,
      updatedUser: user,
    };
  }

  let signOut = false;
  let hasChanges = false;

  if (name && user.name !== name) {
    await updateUserName(user.email, name);
    messages.push("Name changed.");
    hasChanges = true;
  }

  if (language && user.language !== language) {
    await updateUserlocale(user.email, language);
    messages.push("Language changed.");
    hasChanges = true;
  }

  if (email && user.email !== email && validateEmail(email).isValid) {
    await updateUserEmail(user, email);
    messages.push(
      "E-Mail changed. Please confirm your new address. Until confirmation, sign in using your old address",
    );
    hasChanges = true;
  }

  if (newPassword) {
    await updateUserPassword(user.id, newPassword);
    await revokeToken(user, jwtString);
    messages.push("Password changed. Please sign in with your new password");
    signOut = true;
    hasChanges = true;
  }

  if (hasChanges) {
    const updatedUser = await getUserByEmail(email ?? user.email);
    return {
      updated: true,
      signOut,
      messages,
      updatedUser: updatedUser ?? user,
    };
  }

  return {
    updated: false,
    messages: [],
    signOut: false,
    updatedUser: user,
  };
};

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
): Promise<boolean | "unauthorized"> => {
  const verifiedUser = await verifyLogin(user.email, password);
  if (verifiedUser === null) return "unauthorized";
  await revokeToken(user, jwtString);
  return (await deleteUserByEmail(user.email)).count > 0;
};

/**
 * Confirms a users email address by processing the token sent to the user and updating
 * the profile when successful.
 * @param emailConfirmationToken Token sent to the user via mail to the to-be-confirmed address
 * @param emailToConfirm To-be-confirmed addresss
 * @returns The updated user profile when successful or null when the specified user
 * does not exist or the token is invalid.
 */
export const confirmEmail = async (
  emailConfirmationToken: string,
  emailToConfirm: string,
): Promise<User | null> => {
  const u = await drizzleClient.query.user.findFirst({
    where: (user, { eq }) => eq(user.unconfirmedEmail, emailToConfirm),
  });

  if (!u || u.emailConfirmationToken !== emailConfirmationToken) return null;

  const updatedUser = await drizzleClient
    .update(user)
    .set({
      emailIsConfirmed: true,
      emailConfirmationToken: null,
      email: emailToConfirm,
      unconfirmedEmail: null,
    })
    .returning();

  return updatedUser[0];
};

/**
 * Initiates a password request for the user with the given email address.
 * Overwrites existing requests.
 * @param email The email address to request a password reset for
 */
export const requestPasswordReset = async (email: string) => {
  const user = await drizzleClient.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email.toLowerCase()),
  });

  if (!user) return;

  await drizzleClient
    .insert(passwordResetRequest)
    .values({ userId: user.id })
    .onConflictDoUpdate({
      target: passwordResetRequest.userId,
      set: {
        token: uuidv4(),
        expiresAt: new Date(Date.now() + 12 * ONE_HOUR_MILLIS), // 12 hours from now
      },
    });

  // TODO send out email
};

/**
 * Resets a users password using a specified passwordResetToken received through an email.
 * @param passwordResetToken A token sent to the user via email to allow a password reset without being logged in.
 * @param newPassword The new password for the user
 * @returns "forbidden" if the user is not entitled to reset the password with the given parameters,
 * "expired" if the {@link passwordResetToken} is expired,
 * "invalid_password_format" if the specified new password does not comply with the password requirements,
 * "success" if the password was successfuly set to the {@link newPassword}
 */
export const resetPassword = async (
  passwordResetToken: string,
  newPassword: string,
): Promise<"forbidden" | "expired" | "invalid_password_format" | "success"> => {
  const passwordReset =
    await drizzleClient.query.passwordResetRequest.findFirst({
      where: (reset, { eq }) => eq(reset.token, passwordResetToken),
    });

  if (!passwordReset) return "forbidden";

  if (Date.now() > passwordReset.expiresAt.getTime()) return "expired";

  // Validate new Password
  if (validatePassword(newPassword).isValid === false)
    return "invalid_password_format";

  const updated = await updateUserPassword(passwordReset.userId, newPassword);

  invariant(updated.length === 1);
  // invalidate password reset token
  await drizzleClient
    .delete(passwordResetRequest)
    .where(eq(passwordResetRequest.token, passwordResetToken));

  // TODO: invalidate refreshToken and active accessTokens

  return "success";
};

/**
 * Resends the email confirmation for the given user again.
 * This will reset existing email confirmation tokens and therefore
 * make outstanding requests invalid.
 * @param u The user to resend the email confirmation
 * @returns "already_confirmed" if there is no email confirmation pending,
 * else the updated user containing the new email confirmation token
 */
export const resendEmailConfirmation = async (
  u: User,
): Promise<"already_confirmed" | User> => {
  if (u.emailIsConfirmed && u.unconfirmedEmail?.trim().length === 0)
    return "already_confirmed";

  const savedUser = await drizzleClient
    .update(user)
    .set({
      emailConfirmationToken: uuidv4(),
    })
    .where(eq(user.id, u.id))
    .returning();

  // TODO actually send the confirmation
  return savedUser[0];
};

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
  });
  if (!user) return null;

  const correctPassword = await bcrypt.compare(
    preparePasswordHash(password),
    user.password.hash,
  );
  if (!correctPassword) return null;

  const { token, refreshToken } = await createToken(user);
  return { user, jwt: token, refreshToken };
};

