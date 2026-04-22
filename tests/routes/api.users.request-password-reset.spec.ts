import { generateTestUserCredentials } from 'tests/data/generate_test_user'
import { type Route } from '../../.react-router/types/app/routes/+types/api.users.request-password-reset'
import { BASE_URL } from '../../vitest.setup'
import { deleteUserByEmail } from '~/db/models/user.server'
import { action } from '~/routes/api.users.request-password-reset'
import { registerUser } from '~/services/user-service.server'

const VALID_USER = generateTestUserCredentials()

describe('openSenseMap API Routes: /users', () => {
	describe('/request-password-reset', () => {
		beforeAll(async () => {
			await registerUser(
				VALID_USER.name,
				VALID_USER.email,
				VALID_USER.password,
				'en_US',
				true,
			)
		})

		describe('POST', () => {
			it('should allow to request a password reset token', async () => {
				const params = new URLSearchParams(VALID_USER)

				const request = new Request(
					`${BASE_URL}/users/request-password-reset`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
						body: params.toString(),
					},
				)

				const response = (await action({
					request,
				} as Route.ActionArgs)) as Response

				expect(response.status).toBe(200)
			})
		})

		afterAll(async () => {
			// delete the valid test user
			await deleteUserByEmail(VALID_USER.email)
		})
	})
})
