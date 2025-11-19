import { type ActionFunction, type ActionFunctionArgs } from 'react-router'
import { postSingleMeasurement } from '~/lib/measurement-service.server'
import { StandardResponse } from '~/utils/response-utils'

export const action: ActionFunction = async ({
	request,
	params,
}: ActionFunctionArgs): Promise<Response> => {
	try {
		const { deviceId, sensorId } = params

		if (!deviceId || !sensorId)
			return StandardResponse.badRequest(
				'Invalid device id or sensor id specified',
			)

		const authorization = request.headers.get('authorization')
		const contentType = request.headers.get('content-type') || ''

		if (!contentType.includes('application/json'))
			return StandardResponse.unsupportedMediaType(
				'Content-Type must be application/json',
			)

		const body = await request.json()

		await postSingleMeasurement(deviceId, sensorId, body, authorization)

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

		return StandardResponse.internalServerError(
			err.message || 'An unexpected error occurred',
		)
	}
}
