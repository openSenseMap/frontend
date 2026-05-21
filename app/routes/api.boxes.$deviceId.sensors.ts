import { type Route } from './+types/api.boxes.$deviceId.sensors'
import { StandardResponse } from '~/lib/responses'
import { getLatestMeasurements } from '~/services/measurement-service.server'
import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import { SensorSchema } from '~/lib/openapi/schemas/sensor'
import { MeasurementSchema } from '~/lib/openapi/schemas/measurement'
import {
	badRequestResponse,
	createBadRequestErrorSchema,
	internalServerErrorResponse,
	InternalServerErrorSchema,
	NotFoundErrorSchema,
	notFoundResponse,
} from '~/lib/openapi/errors'
import { DevicePathParamsSchema } from '~/lib/openapi/schemas/common'
import { apiMessages } from '~/lib/openapi/messages'

const messages = {
	invalidCount:
		'Illegal value for parameter count. allowed values: numbers from 1 to 100',
}

const DeviceSensorsQueryParamsSchema = z.object({
	count: z.coerce.number().int().min(1).max(100).optional().meta({
		description:
			'Number of measurements to retrieve for every sensor. Allowed values are numbers from 1 to 100.',
		example: 5,
	}),
})

const SensorWithLatestMeasurementSchema = SensorSchema.and(
	MeasurementSchema,
).meta({
	id: 'SensorWithLatestMeasurement',
	description: 'Sensor metadata combined with its latest measurement fields.',
})

const DeviceWithSensorsSchema = z
	.object({
		id: z.string().meta({
			description: 'Device id',
			example: '5bdbe70f55d0ad001a04edc9',
		}),

		sensors: z.array(SensorWithLatestMeasurementSchema).meta({
			description:
				'Sensors of this device, each enriched with latest measurement data.',
		}),
	})
	.meta({
		id: 'DeviceWithSensors',
		description: 'Device including sensors with their latest measurement data.',
	})

const DeviceSensorsBadRequestErrorSchema = createBadRequestErrorSchema({
	id: 'DeviceSensorsBadRequestError',
	description:
		'Bad request. This can happen when the `count` query parameter is invalid.',
	examples: [
		'Illegal value for parameter count. allowed values: numbers from 1 to 100',
	],
})

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['Sensors'],
		summary: 'Get latest measurements of all sensors of a device',
		description:
			'Returns the specified device with its sensors. Each sensor is enriched with latest measurement data. The optional `count` query parameter controls how many measurements are retrieved per sensor, depending on service behavior.',
		operationId: 'getDeviceSensorMeasurements',

		requestParams: {
			path: DevicePathParamsSchema,
			query: DeviceSensorsQueryParamsSchema,
		},

		responses: {
			200: {
				description: 'Device sensors returned successfully.',
				content: {
					'application/json': {
						schema: DeviceWithSensorsSchema,
					},
				},
			},

			400: badRequestResponse(
				DeviceSensorsBadRequestErrorSchema,
				'Bad request. This can happen when the `count` query parameter is invalid.',
			),

			404: notFoundResponse(NotFoundErrorSchema, 'Device not found.'),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

export const loader = async ({
	request,
	params,
}: Route.LoaderArgs): Promise<Response> => {
	try {
		const deviceId = params.deviceId

		if (deviceId === undefined) {
			return StandardResponse.badRequest(apiMessages.deviceIdRequired)
		}

		const url = new URL(request.url)
		const countParam = url.searchParams.get('count')

		let count: undefined | number = undefined

		if (countParam !== null) {
			count = Number(countParam)

			if (!Number.isInteger(count) || count < 1 || count > 100) {
				return StandardResponse.badRequest(messages.invalidCount)
			}
		}

		const meas = await getLatestMeasurements(deviceId, count)

		if (!meas) {
			return StandardResponse.notFound(apiMessages.deviceNotFound)
		}

		return StandardResponse.ok(meas)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
