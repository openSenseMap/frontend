import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { createProfileWithTransaction } from './profile.server'
import { drizzleClient } from '~/db.server'
import {
	type Password,
	type User,
	password as passwordTable,
	user,
} from '~/schema'

export async function getUserById(id: User['id']) {
	return drizzleClient.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, id),
	})
}

export async function getUserByEmail(email: User['email']) {
	return drizzleClient.query.user.findFirst({
		where: (user, { eq }) => eq(user.email, email),
	})
}

export async function getUserByUsername(username: User['name']) {
	return drizzleClient.query.user.findFirst({
		where: (user, { eq }) => eq(user.name, username),
	})
}

// export async function getUserWithDevicesByName(name: User["name"]) {
//   return prisma.user.findUnique({
//     where: { name },
//     include: { devices: true },
//   });
// }

// export async function getUserWithDevicesByNameOrId(
//   name: User["name"],
//   id: User["id"]
// ) {
//   return prisma.user.findUnique({
//     where: {
//       OR: [],
//     },
//     include: { devices: true },
//   });
// }

export async function deleteUserByEmail(email: User['email']) {
	return drizzleClient.delete(user).where(eq(user.email, email))
}

//* user name shouldn't be unique
/* export async function getUserByName(name: User["name"]) {
  return prisma.user.findUnique({ where: { name } });
} */

export const updateUserEmail = (
	userToUpdate: User,
	newEmail: User['email'],
) => {
	return drizzleClient
		.update(user)
		.set({
			unconfirmedEmail: newEmail,
			emailConfirmationToken: uuidv4(),
		})
		.where(eq(user.id, userToUpdate.id))
		.returning()
}

export async function updateUserName(
	email: User['email'],
	newUserName: string,
) {
	return drizzleClient
		.update(user)
		.set({
			name: newUserName,
		})
		.where(eq(user.email, email))
}

export async function updateUserPassword(
	userId: Password['userId'],
	newPassword: string,
) {
	const hashedPassword = await bcrypt.hash(preparePasswordHash(newPassword), 13)
	return drizzleClient
		.update(passwordTable)
		.set({
			hash: hashedPassword,
		})
		.where(eq(passwordTable.userId, userId))
		.returning()
}

export async function updateUserlocale(
	email: User['email'],
	language: User['language'],
) {
	return drizzleClient
		.update(user)
		.set({
			language: language,
		})
		.where(eq(user.email, email))
}

export async function getUsers() {
	return drizzleClient.query.user.findMany()
}

export const preparePasswordHash = function preparePasswordHash(
	plaintextPassword: string,
) {
	// first round: hash plaintextPassword with sha512
	const hash = crypto.createHash('sha512')
	hash.update(plaintextPassword.toString(), 'utf8')
	const hashed = hash.digest('base64') // base64 for more entropy than hex

	return hashed
}

export async function createUser(
	name: User['name'],
	email: User['email'],
	language: User['language'],
	password: string,
) {
	const hashedPassword = await bcrypt.hash(preparePasswordHash(password), 13) // make salt_factor configurable oSeM API uses 13 by default

	return await drizzleClient.transaction(async (t) => {
		const newUser = await t
			.insert(user)
			.values({
				name,
				email,
				language,
				unconfirmedEmail: email,
			})
			.returning()
		await t.insert(passwordTable).values({
			hash: hashedPassword,
			userId: newUser[0].id,
		})
		await createProfileWithTransaction(t, newUser[0].id, name)
		return newUser
	})
}

export async function verifyLogin(
	email: User['email'],
	password: Password['hash'],
) {
	const userWithPassword = await drizzleClient.query.user.findFirst({
		where: (user, { eq }) => eq(user.email, email),
		with: {
			profile: true,
			password: true,
		},
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	//* compare stored password with entered one
	const isValid = await bcrypt.compare(
		preparePasswordHash(password),
		userWithPassword.password.hash,
	)

	if (!isValid) {
		return null
	}

	//* exclude password property (using spread operator)
	//* const userWithoutPassword: {id: string; email: string;createdAt: Date; updatedAt: Date;}
	const { password: _password, ...userWithoutPassword } = userWithPassword

	return userWithoutPassword
}
