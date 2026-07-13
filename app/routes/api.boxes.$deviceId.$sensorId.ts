import { type Route } from './+types/api.boxes.$deviceId.$sensorId'
import { StandardResponse } from '~/lib/responses'

import * as z from 'zod/v4'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

import {
	BadRequestErrorSchema,
	ConflictErrorSchema,
	InternalServerErrorSchema,
	MethodNotAllowedErrorSchema,
	NotFoundErrorSchema,
	UnauthorizedErrorSchema,
	UnprocessableContentErrorSchema,
	UnsupportedMediaTypeErrorSchema,
	badRequestResponse,
	conflictResponse,
	internalServerErrorResponse,
	methodNotAllowedResponse,
	notFoundResponse,
	unauthorizedResponse,
	unprocessableContentResponse,
	unsupportedMediaTypeResponse,
} from '~/lib/openapi/errors'

import {
	DeviceSensorPathParamsSchema,
	IsoDateTimeSchema,
} from '~/lib/openapi/schemas/common'

import { parsePathParams } from '~/lib/request-parsing'
import { isValidServiceKey } from '~/db/models/integration.server'
import { postSingleMeasurement } from '~/services/measurement-service.server'
import { MeasurementLocationSchema } from '~/lib/openapi/schemas/measurement'

const PostSensorMeasurementHeaderParamsSchema = z
	.object({
		authorization: z.string().optional().meta({
			description:
				"Device's unique access token. Used as authorization token if the device has authentication enabled.",
			example: 'my-device-access-token',
		}),
	})
	.meta({
		id: 'PostSensorMeasurementHeaderParams',
		description: 'Headers accepted when posting a measurement to one sensor.',
	})

const PostSensorMeasurementRequestSchema = z
	.object({
		value: z.number().meta({
			description:
				'Measured value of the sensor. Legacy documentation says string, but runtime requires a JSON number.',
			example: 21.5,
		}),

		createdAt: IsoDateTimeSchema.optional().meta({
			description:
				'Measurement timestamp. Should conform to RFC 3339. Required when posting measurements with location values.',
			example: '2026-05-22T12:00:00.000Z',
		}),

		location: MeasurementLocationSchema.optional(),
	})
	.meta({
		id: 'PostSensorMeasurementRequest',
		description: 'Payload for posting one measurement to one sensor.',
	})

const PostSensorMeasurementSuccessResponseSchema = z.string().meta({
	id: 'PostSensorMeasurementSuccessResponse',
	description:
		'Plain text success response returned after the measurement was saved.',
	example: 'Measurement saved in box',
})

export const openapi: ZodOpenApiPathItemObject = {
	post: {
		tags: ['Measurements'],
		summary: 'Post new measurement',
		description:
			'Posts one new measurement to a specific sensor of a device. The request body contains the measured value and can optionally include a timestamp and measurement location.',

		requestParams: {
			path: DeviceSensorPathParamsSchema,
			header: PostSensorMeasurementHeaderParamsSchema,
		},

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: PostSensorMeasurementRequestSchema,
				},
			},
		},

		responses: {
			201: {
				description: 'Measurement saved successfully.',
				content: {
					'text/plain': {
						schema: PostSensorMeasurementSuccessResponseSchema,
					},
				},
			},

			400: badRequestResponse(
				BadRequestErrorSchema,
				'Bad request. This can happen when the device id, sensor id, or request body is invalid.',
			),

			401: unauthorizedResponse(
				UnauthorizedErrorSchema,
				'Unauthorized. The device access token is missing or invalid.',
			),

			404: notFoundResponse(NotFoundErrorSchema, 'Device or sensor not found.'),

			405: methodNotAllowedResponse(
				MethodNotAllowedErrorSchema,
				'Method not allowed.',
			),

			409: conflictResponse(
				ConflictErrorSchema,
				'Conflict. Archived devices are read-only.',
			),

			415: unsupportedMediaTypeResponse(
				UnsupportedMediaTypeErrorSchema,
				'Unsupported media type. Use application/json.',
			),

			422: unprocessableContentResponse(
				UnprocessableContentErrorSchema,
				'Unprocessable content. This can happen when the measurement references an invalid sensor, the timestamp is too far in the future, or location coordinates are invalid.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

const parsePostSensorMeasurementBody = async (
	request: Request,
): Promise<z.output<typeof PostSensorMeasurementRequestSchema> | Response> => {
	const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''

	if (!contentType.includes('application/json')) {
		return StandardResponse.unsupportedMediaType(
			'Unsupported content-type. Try application/json',
		)
	}

	let body: unknown

	try {
		body = await request.json()
	} catch {
		return StandardResponse.badRequest('Invalid JSON request body')
	}

	const parsed = PostSensorMeasurementRequestSchema.safeParse(body)

	if (!parsed.success) {
		return StandardResponse.badRequest(
			parsed.error.issues[0]?.message ?? 'Invalid measurement request body',
		)
	}

	return parsed.data
}

export const action = async ({
	request,
	params,
}: Route.ActionArgs): Promise<Response> => {
	try {
		if (request.method !== 'POST') {
			return StandardResponse.methodNotAllowed('Endpoint only supports POST')
		}

		const parsedParams = parsePathParams(params, DeviceSensorPathParamsSchema, {
			message: 'Invalid device id or sensor id specified',
		})

		if (parsedParams instanceof Response) {
			return parsedParams
		}

		const parsedBody = await parsePostSensorMeasurementBody(request)

		if (parsedBody instanceof Response) {
			return parsedBody
		}

		const authorization = request.headers.get('authorization')
		const serviceKey = request.headers.get('x-service-key')
		const isTrustedService = await isValidServiceKey(serviceKey)

		await postSingleMeasurement(
			parsedParams.deviceId,
			parsedParams.sensorId,
			//@ts-ignore
			parsedBody,
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
		if (err.name === 'UnauthorizedError') {
			return StandardResponse.unauthorized(err.message)
		}

		if (err.name === 'NotFoundError') {
			return StandardResponse.notFound(err.message)
		}

		if (err.name === 'UnprocessableEntityError') {
			return StandardResponse.unprocessableContent(err.message)
		}

		if (err.name === 'ModelError' && err.type === 'UnprocessableEntityError') {
			return StandardResponse.unprocessableContent(err.message)
		}

		if (err.name === 'ArchivedDeviceError') {
			return StandardResponse.conflict(
				err.message || 'Archived devices are read-only',
			)
		}

		return StandardResponse.internalServerError(
			err.message || 'An unexpected error occurred',
		)
	}
}
