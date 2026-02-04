import { type ActionFunction, type ActionFunctionArgs } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import { resendEmailConfirmation } from '~/lib/user-service.server'
import { getUserByEmail } from '~/models/user.server'
import { StandardResponse } from '~/utils/response-utils'
import { getUserEmail } from '~/utils/session.server'

export const action: ActionFunction = async ({
	request,
}: ActionFunctionArgs) => {
	try {
		// Try session-based auth first (for web UI)
		const sessionEmail = await getUserEmail(request)
		let user = sessionEmail ? await getUserByEmail(sessionEmail) : null

		// Fall back to JWT auth (for API clients)
		if (!user) {
			const jwtResponse = await getUserFromJwt(request)
			if (!jwtResponse || typeof jwtResponse === 'string') {
				return StandardResponse.forbidden(
					'Invalid authorization. Please sign in.',
				)
			}
			user = jwtResponse
		}

		const result = await resendEmailConfirmation(user)
		if (result === 'already_confirmed') {
			return StandardResponse.unprocessableContent(
				`Email address ${user.email} is already confirmed.`,
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
