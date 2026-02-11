import { type ActionFunction, type ActionFunctionArgs } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import { resendEmailConfirmation } from '~/lib/user-service.server'
import { StandardResponse } from '~/utils/response-utils'

export const action: ActionFunction = async ({
	request,
}: ActionFunctionArgs) => {
	try {
		// JWT auth only (session-based auth is handled in route actions)
		const jwtResponse = await getUserFromJwt(request)
		if (!jwtResponse || typeof jwtResponse === 'string') {
			return StandardResponse.forbidden(
				'Invalid authorization. Please sign in.',
			)
		}

		const result = await resendEmailConfirmation(jwtResponse)
		if (result === 'already_confirmed') {
			return StandardResponse.unprocessableContent(
				`Email address ${jwtResponse.email} is already confirmed.`,
			)
		}

		return StandardResponse.ok({
			code: 'Ok',
			message: `Email confirmation has been sent to ${result.unconfirmedEmail}`,
		})
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
