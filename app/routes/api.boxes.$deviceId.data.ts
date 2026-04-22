import { type Route } from './+types/api.boxes.$deviceId.data'
import { isValidServiceKey } from '~/db/models/integration.server'
import { postNewMeasurements } from '~/services/measurement-service.server'
import { StandardResponse } from '~/lib/responses'

/**
 * @openapi
 * /boxes/{deviceId}/data:
 *   post:
 *    tags:
 *      - Sensors
 *    summary: Post multiple new measurements in multiple formats to a box. Allows the use of csv, json array and json object notation.
 *    description:
 *    parameters:
 *      - in: header
 *        name: x-osem-device-api-key
 *        schema:
 *          type: string
 *        description: alternative HTTP header for authorizing your device if you cannot use the HTTP Authorization header
 */
export const action = async ({
	request,
	params,
}: Route.ActionArgs): Promise<Response> => {
	try {
		const deviceId = params.deviceId
		if (deviceId === undefined)
			return StandardResponse.badRequest('Invalid device id specified')

		const searchParams = new URL(request.url).searchParams
		const luftdaten = searchParams.get('luftdaten') !== null
		const hackair = searchParams.get('hackair') !== null

		const contentType = request.headers.get('content-type') || ''
		const serviceKey = request.headers.get('x-service-key')
		const authorization =
			request.headers.get('authorization') ??
			request.headers.get('x-osem-device-api-key')

		const isTrustedService = await isValidServiceKey(serviceKey)

		let body: any
		if (contentType.includes('application/json')) {
			body = await request.json()
		} else if (contentType.includes('text/csv')) {
			body = await request.text()
		} else if (contentType.includes('application/sbx-bytes')) {
			body = await request.arrayBuffer()
		} else {
			body = await request.text()
		}

		await postNewMeasurements(deviceId, body, {
			contentType,
			luftdaten,
			hackair,
			authorization: isTrustedService ? undefined : authorization,
			isTrustedService,
		})

		return new Response('Measurements saved in box', {
			status: 201,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
			},
		})
	} catch (err: any) {
		// Handle different error types
		if (err.name === 'UnauthorizedError')
			return StandardResponse.unauthorized(err.message)

		if (err.name === 'ModelError' && err.type === 'UnprocessableEntityError')
			return StandardResponse.unprocessableContent(err.message)

		if (err.name === 'UnsupportedMediaTypeError')
			return StandardResponse.unsupportedMediaType(err.message)

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
