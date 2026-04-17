import { type Route } from './+types/api.users.confirm-email'
import { confirmEmail } from '~/lib/user-service.server'
import { StandardResponse } from '~/utils/response-utils'

export const action = async ({ request }: Route.ActionArgs) => {
	let formData = new FormData()

	try {
		formData = await request.formData()
	} catch {
		// Continue so the missing-token validation below handles malformed requests.
	}

	const token = formData.get('token')?.toString().trim()

	if (!token) {
		return StandardResponse.badRequest('No email confirmation token specified.')
	}

	try {
		const result = await confirmEmail(token)

		if (result === 'success') {
			return StandardResponse.ok({
				code: 'Ok',
				message: 'E-Mail successfully confirmed. Thank you',
			})
		}

		if (result === 'expired') {
			return StandardResponse.forbidden(
				'Invalid or expired confirmation token.',
			)
		}

		return StandardResponse.forbidden('Invalid or expired confirmation token.')
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
