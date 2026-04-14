import { randomBytes, randomUUID } from 'crypto'

/**
 * Generates valid credentials for a user to run a unit test with.
 * @returns A valid user object containing the credentials required to create it
 */
export const generateTestUserCredentials = (): {
	name: string
	email: string
	password: string
} => {
	return {
		name: randomUUID().toString(),
		email: `${randomBytes(6).toString('hex')}@${randomBytes(6).toString('hex')}.${randomBytes(2).toString('hex')}`,
		password: randomBytes(20).toString('hex'),
	}
}
