import { type ActionFunctionArgs } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import { claimBox } from '~/lib/transfer-service.server'
import { StandardResponse } from '~/utils/response-utils'

export const action = async ({ request }: ActionFunctionArgs) => {
	const contentType = request.headers.get('content-type')
	if (!contentType || !contentType.includes('application/json'))
		return StandardResponse.unsupportedMediaType(
			'Unsupported content-type. Try application/json',
		)

	if (request.method !== 'POST')
		return StandardResponse.methodNotAllowed('Only POST allowed')

	const jwtResponse = await getUserFromJwt(request)

	if (typeof jwtResponse === 'string')
		return StandardResponse.forbidden('Invalid JWT. Please sign in')

	try {
		const body = await request.json()
		const { token } = body

		if (!token) return StandardResponse.badRequest('token is required')

		const result = await claimBox(jwtResponse.id, token)

		return StandardResponse.ok({
			message: 'Device successfully claimed!',
			data: result,
		})
	} catch (err) {
		console.error('Error claiming box:', err)
		return handleClaimError(err)
	}
}

const handleClaimError = (err: unknown) => {
	if (err instanceof Error) {
		const message = err.message

		if (message.includes('expired') || message.includes('Invalid or expired'))
			return StandardResponse.gone(message)

		if (message.includes('not found')) return StandardResponse.notFound(message)

		if (
			message.includes('required') ||
			message.includes('Invalid') ||
			message.includes('already own')
		)
			return StandardResponse.badRequest(message)
	}

	return StandardResponse.internalServerError()
}
