import { type Route } from './+types/api.boxes.$deviceId.$sensorId'
import { isValidServiceKey } from '~/db/models/integration.server'
import { StandardResponse } from '~/lib/responses'
import { postSingleMeasurement } from '~/services/measurement-service.server'

export const action = async ({
	request,
	params,
}: Route.ActionArgs): Promise<Response> => {
	try {
		const { deviceId, sensorId } = params

		if (!deviceId || !sensorId)
			return StandardResponse.badRequest(
				'Invalid device id or sensor id specified',
			)

		const authorization =
			request.headers.get('authorization') ??
			request.headers.get('x-osem-device-api-key')
		const contentType = request.headers.get('content-type') || ''

		const serviceKey = request.headers.get('x-service-key')
		const isTrustedService = await isValidServiceKey(serviceKey)

		if (!contentType.includes('application/json'))
			return StandardResponse.unsupportedMediaType(
				'Content-Type must be application/json',
			)

		const body = await request.json()

		await postSingleMeasurement(
			deviceId,
			sensorId,
			body,
			authorization,
			isTrustedService,
		)

		return new Response('Measurement saved in box', {
			status: 201,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
			},
		})
	} catch (err: any) {
		if (err.name === 'UnauthorizedError')
			return StandardResponse.unauthorized(err.message)

		if (err.name === 'NotFoundError')
			return StandardResponse.notFound(err.message)

		if (
			err.name === 'UnprocessableEntityError' ||
			err.type === 'UnprocessableEntityError' ||
			(err.name === 'ModelError' && err.type === 'UnprocessableEntityError')
		)
			return StandardResponse.unprocessableContent(err.message)

		if (err.name === 'ArchivedDeviceError')
			return new Response(
				JSON.stringify({
					message: err.message || 'Archived devices are read-only',
				}),
				{
					status: 409,
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
				},
			)

		return StandardResponse.internalServerError(
			err.message || 'An unexpected error occurred',
		)
	}
}
