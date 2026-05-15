import { z } from 'zod'
import { type Params } from 'react-router'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import { type Route } from './+types/api.boxes.$deviceId.locations'
import { getLocations } from '~/db/models/device.server'
import { parseDateParam, parseEnumParam } from '~/lib/params'
import { StandardResponse } from '~/lib/responses'

const messages = {
	invalidDeviceId: 'Invalid device id specified',
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

const DeviceLocationsPathParamsSchema = z.object({
	deviceId: z.string().min(1).meta({
		description: 'The ID of the device you are referring to',
		example: '60a13611a877b3001b8ffd59',
	}),
})

const DeviceLocationsQueryParamsSchema = z.object({
	'from-date': z.string().datetime().optional().meta({
		description:
			'Beginning date of location data. Defaults to 48 hours ago from now.',
		example: '2026-05-13T12:00:00.000Z',
	}),
	'to-date': z.string().datetime().optional().meta({
		description: 'End date of location data. Defaults to now.',
		example: '2026-05-15T12:00:00.000Z',
	}),
	format: z.enum(['json', 'geojson']).default('json').meta({
		description: "Can be 'json' or 'geojson'. Defaults to 'json'.",
		example: 'json',
	}),
})

const CoordinatesSchema = z.tuple([z.number(), z.number()]).meta({
	description: '[longitude, latitude]',
	example: [7.68123, 51.9123],
})

const PointLocationSchema = z
	.object({
		coordinates: CoordinatesSchema,
		type: z.literal('Point'),
		timestamp: z.string().datetime().meta({
			description: 'Timestamp of the device location',
			example: '2017-07-27T12:00:00.000Z',
		}),
	})
	.meta({
		id: 'DeviceLocationPoint',
		description: 'Location of a device as GeoJSON Point-like object.',
		example: {
			coordinates: [7.68123, 51.9123],
			type: 'Point',
			timestamp: '2017-07-27T12:00:00.000Z',
		},
	})

const JsonLocationsResponseSchema = z.array(PointLocationSchema).meta({
	id: 'DeviceLocationsJsonResponse',
	description:
		'Device locations ordered by date as an array of GeoJSON Point-like objects.',
	example: [
		{
			coordinates: [7.68123, 51.9123],
			type: 'Point',
			timestamp: '2017-07-27T12:00:00.000Z',
		},
		{
			coordinates: [7.68223, 51.9433],
			type: 'Point',
			timestamp: '2017-07-27T12:01:00.000Z',
		},
		{
			coordinates: [7.68323, 51.9423],
			type: 'Point',
			timestamp: '2017-07-27T12:02:00.000Z',
		},
	],
})

const GeoJsonLineStringResponseSchema = z
	.object({
		type: z.literal('Feature'),
		geometry: z.object({
			type: z.literal('LineString'),
			coordinates: z.array(CoordinatesSchema),
		}),
		properties: z.object({
			timestamps: z.array(
				z.string().datetime().meta({
					example: '2017-07-27T12:00:00.000Z',
				}),
			),
		}),
	})
	.meta({
		id: 'DeviceLocationsGeoJsonResponse',
		description:
			'GeoJSON Feature containing a LineString. `properties.timestamps` contains one timestamp for each coordinate.',
		example: {
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: [
					[7.68123, 51.9123],
					[7.68223, 51.9433],
					[7.68323, 51.9423],
				],
			},
			properties: {
				timestamps: [
					'2017-07-27T12:00:00.000Z',
					'2017-07-27T12:01:00.000Z',
					'2017-07-27T12:02:00.000Z',
				],
			},
		},
	})

const BadRequestErrorSchema = standardErrorResponseSchema(
	'Bad Request',
	z.string().meta({
		example: messages.invalidDeviceId,
	}),
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
		tags: ['Boxes'],
		summary: 'Get locations of a device',
		description:
			'Get all locations of the specified device ordered by date. By default, the response is an array of GeoJSON Point-like objects. If `format=geojson`, a GeoJSON LineString Feature is returned, with `properties.timestamps` containing one timestamp for each coordinate.',
		operationId: 'getDeviceLocations',

		requestParams: {
			path: DeviceLocationsPathParamsSchema,
			query: DeviceLocationsQueryParamsSchema,
		},

		responses: {
			200: {
				description: 'Success',
				content: {
					'application/json': {
						schema: JsonLocationsResponseSchema,
					},
					'application/geo+json': {
						schema: GeoJsonLineStringResponseSchema,
					},
				},
			},
			400: {
				description:
					'Bad request. This can happen for an invalid device id, invalid date parameter, or invalid format parameter.',
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
		const collected = collectParameters(request, params)
		if (collected instanceof Response) return collected

		const { deviceId, fromDate, toDate, format } = collected

		const locations = await getLocations({ id: deviceId }, fromDate, toDate)

		if (!locations) {
			return StandardResponse.notFound(messages.deviceNotFound)
		}

		const jsonLocations = locations.map((location) => {
			return {
				coordinates: [location.x, location.y],
				type: 'Point',
				timestamp: location.time,
			}
		})

		const responseInit: ResponseInit = {
			status: 200,
			headers: {
				'content-type':
					format === 'json'
						? 'application/json; charset=utf-8'
						: 'application/geo+json; charset=utf-8',
			},
		}

		if (format === 'json') {
			return Response.json(jsonLocations, responseInit)
		}

		const geoJsonLocations = {
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: jsonLocations.map((location) => location.coordinates),
			},
			properties: {
				timestamps: jsonLocations.map((location) => location.timestamp),
			},
		}

		return Response.json(geoJsonLocations, responseInit)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}

function collectParameters(
	request: Request,
	params: Params<string>,
):
	| Response
	| {
			deviceId: string
			fromDate: Date
			toDate: Date
			format: 'json' | 'geojson'
	  } {
	const deviceId = params.deviceId

	if (deviceId === undefined) {
		return StandardResponse.badRequest(messages.invalidDeviceId)
	}

	const url = new URL(request.url)

	const fromDate = parseDateParam(
		url,
		'from-date',
		new Date(new Date().setDate(new Date().getDate() - 2)),
	)

	if (fromDate instanceof Response) return fromDate

	const toDate = parseDateParam(url, 'to-date', new Date())

	if (toDate instanceof Response) return toDate

	const format = parseEnumParam(url, 'format', ['json', 'geojson'], 'json')

	if (format instanceof Response) return format

	return {
		deviceId,
		fromDate,
		toDate,
		format: format as 'json' | 'geojson',
	}
}
