import { type ActionFunctionArgs } from 'react-router'
import { generateTestUserCredentials } from 'tests/data/generate_test_user'
import { BASE_URL } from 'vitest.setup'
import { createToken } from '~/lib/jwt'
import { registerUser } from '~/lib/user-service.server'
import { deleteUserByEmail } from '~/models/user.server'
import { action } from '~/routes/api.sign-out'
import { type User } from '~/schema'

const VALID_SIGN_OUT_TEST_USER = generateTestUserCredentials()

describe('openSenseMap API Routes: /users', () => {
	describe('/sign-out', () => {
		let jwt: string = ''
		beforeAll(async () => {
			const user = await registerUser(
				VALID_SIGN_OUT_TEST_USER.name,
				VALID_SIGN_OUT_TEST_USER.email,
				VALID_SIGN_OUT_TEST_USER.password,
				'en_US',
			)
			;({ token: jwt } = await createToken(user as User))
		})

		describe('/POST', () => {
			it('should allow to sign out with jwt', async () => {
				// Arrange
				const request = new Request(`${BASE_URL}/users/sign-out`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${jwt}`,
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: '', // No body needed, but must be present for POST
				})

				// Act
				const dataFunctionValue = await action({
					request,
				} as ActionFunctionArgs)
				const response = dataFunctionValue as Response

				// Assert
				expect(dataFunctionValue).toBeInstanceOf(Response)
				expect(response.status).toBe(200)
				expect(response.headers.get('content-type')).toBe(
					'application/json; charset=utf-8',
				)
			})
		})

		afterAll(async () => {
			// delete the valid test user
			await deleteUserByEmail(VALID_SIGN_OUT_TEST_USER.email)
		})
	})
})
