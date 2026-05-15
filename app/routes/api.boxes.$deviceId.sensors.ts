import { type Route } from './+types/api.boxes.$deviceId.sensors'
import { StandardResponse } from '~/lib/responses'
import { getLatestMeasurements } from '~/services/measurement-service.server'
import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

const messages = {
	invalidDeviceId: 'Invalid device id specified',
	invalidCount:
		'Illegal value for parameter count. allowed values: numbers from 1 to 100',
	deviceNotFound: 'Device not found',
	internal:
		'The server was unable to complete your request. Please try again later.',
}

const standardErrorResponseSchema = <Code extends string>(
	code: Code,
	messageSchema: z.ZodType<string> = z.string(),
) =>
	z.object({
		code: z.literal(code),
		message: messageSchema,
		error: messageSchema,
	})

const unknownJsonSchema = z.unknown().nullable().meta({
	description: 'Arbitrary JSON data',
})

const LastMeasurementSchema = z
	.object({
		value: z.number().nullable().meta({
			example: 23.42,
		}),
		createdAt: z.string().datetime().meta({
			example: '2026-05-15T12:00:00.000Z',
		}),
		sensorId: z.string().meta({
			example: '60a13611a877b3001b8ffd59',
		}),
	})
	.meta({
		id: 'LastMeasurement',
		description: 'Cached latest measurement for a sensor.',
	})

const DeviceSensorsPathParamsSchema = z.object({
	deviceId: z.string().min(1).meta({
		description: 'The ID of the device you are referring to',
		example: '60a13611a877b3001b8ffd59',
	}),
})

const DeviceSensorsQueryParamsSchema = z.object({
	count: z.coerce.number().int().min(1).max(100).optional().meta({
		description: 'Number of measurements to retrieve for every sensor',
		example: 5,
	}),
})

const SensorSchema = z
	.object({
		id: z.string().meta({
			description: 'Sensor id',
			example: '60a13611a877b3001b8ffd59',
		}),
		title: z.string().nullable().meta({
			description: 'Sensor title',
			example: 'Temperature',
		}),
		unit: z.string().nullable().meta({
			description: 'Measurement unit',
			example: '°C',
		}),
		sensorType: z.string().nullable().meta({
			description: 'Sensor type',
			example: 'HDC1080',
		}),
		icon: z.string().nullable().meta({
			description: 'Sensor icon',
			example: 'osem-thermometer',
		}),
		status: z.string().nullable().meta({
			description: 'Sensor status',
			example: 'active',
		}),
		createdAt: z.string().datetime().meta({
			description: 'Sensor creation timestamp',
			example: '2026-05-15T12:00:00.000Z',
		}),
		updatedAt: z.string().datetime().meta({
			description: 'Sensor update timestamp',
			example: '2026-05-15T12:00:00.000Z',
		}),
		deviceId: z.string().meta({
			description: 'ID of the device this sensor belongs to',
			example: '5bdbe70f55d0ad001a04edc9',
		}),
		sensorWikiType: z.string().nullable().meta({
			example: 'temperature',
		}),
		sensorWikiPhenomenon: z.string().nullable().meta({
			example: 'air_temperature',
		}),
		sensorWikiUnit: z.string().nullable().meta({
			example: 'degree_celsius',
		}),
		lastMeasurement: LastMeasurementSchema.nullable(),
		data: unknownJsonSchema,
		order: z.number().int().nullable().meta({
			description: 'Display order of the sensor',
			example: 0,
		}),
	})
	.meta({
		id: 'Sensor',
		description: 'Sensor metadata.',
	})

const MeasurementSchema = z
	.object({
		sensorId: z.string().meta({
			description: 'ID of the sensor this measurement belongs to',
			example: '60a13611a877b3001b8ffd59',
		}),
		time: z.string().datetime().meta({
			description: 'Measurement timestamp',
			example: '2026-05-15T12:00:00.000Z',
		}),
		value: z.number().nullable().meta({
			description: 'Measured value',
			example: 23.42,
		}),
		/**
		 * Note: if this field is returned as a real JS bigint,
		 * Response.json will fail because BigInt cannot be JSON serialized.
		 * If it is converted before returning, document it as string or number.
		 */
		locationId: z.union([z.string(), z.number()]).nullable().meta({
			description: 'Location id associated with the measurement',
			example: '123',
		}),
	})
	.meta({
		id: 'Measurement',
		description: 'Measurement data.',
	})

const SensorWithLatestMeasurementSchema = SensorSchema.and(
	MeasurementSchema,
).meta({
	id: 'SensorWithLatestMeasurement',
	description: 'Sensor metadata combined with its latest measurement fields.',
})

const DeviceWithSensorsSchema = z
	.looseObject({
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
		description:
			'Device including sensors with their latest measurement data. Additional device fields are included according to the device model.',
	})

const BadRequestErrorSchema = standardErrorResponseSchema(
	'Bad Request',
	z.union([
		z.literal(messages.invalidDeviceId),
		z.literal(messages.invalidCount),
	]),
).meta({ id: 'BadRequestError' })

const NotFoundErrorSchema = standardErrorResponseSchema(
	'Not Found',
	z.literal(messages.deviceNotFound),
).meta({ id: 'NotFoundError' })

const InternalServerErrorSchema = standardErrorResponseSchema(
	'Internal Server Error',
	z.string().meta({
		example: messages.internal,
	}),
).meta({ id: 'InternalServerError' })

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['Sensors'],
		summary: 'Get latest measurements of all sensors of a device',
		description:
			'Returns the specified device with its sensors. Each sensor is enriched with its latest measurement data. The optional `count` query parameter controls how many measurements are retrieved per sensor, depending on service behavior.',
		operationId: 'getDeviceSensorMeasurements',

		requestParams: {
			path: DeviceSensorsPathParamsSchema,
			query: DeviceSensorsQueryParamsSchema,
		},

		responses: {
			200: {
				description: 'Success',
				content: {
					'application/json': {
						schema: DeviceWithSensorsSchema,
					},
				},
			},
			400: {
				description:
					'Bad request. This can happen for an invalid device id or invalid count parameter.',
				content: {
					'application/json': {
						schema: BadRequestErrorSchema,
					},
				},
			},
			404: {
				description: 'Device not found',
				content: {
					'application/json': {
						schema: NotFoundErrorSchema,
					},
				},
			},
			500: {
				description: 'Internal server error',
				content: {
					'application/json': {
						schema: InternalServerErrorSchema,
					},
				},
			},
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
			return StandardResponse.badRequest(messages.invalidDeviceId)
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
			return StandardResponse.notFound(messages.deviceNotFound)
		}

		return StandardResponse.ok(meas)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
