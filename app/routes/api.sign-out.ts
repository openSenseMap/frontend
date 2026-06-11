import { type Route } from './+types/api.sign-out'
import { type User } from '~/db/schema'
import { getUserFromJwt, revokeToken } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'

export const action = async ({ request }: Route.ActionArgs) => {
	try {
		// We deliberately make casts and stuff like that, so everything
		// but the happy path will result in an internal server error.
		// This is done s.t. we are not leaking information if someone
		// tries sending random token to see if users exist or similar
		const user = (await getUserFromJwt(request)) as User
		const rawAuthorizationHeader = request.headers
			.get('authorization')!
			.toString()
		const [, jwtString = ''] = rawAuthorizationHeader.split(' ')
		await revokeToken(user, jwtString)
		return StandardResponse.ok({
			code: 'Ok',
			message: 'Successfully signed out',
		})
	} catch {
		return StandardResponse.internalServerError()
	}
}
