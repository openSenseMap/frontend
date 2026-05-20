import { type Route } from './+types/api.boxes'
import {
	createDevice,
	findDevices,
	type FindDevicesOptions,
} from '~/db/models/device.server'
import { type Device, type User } from '~/db/schema'
import { transformDeviceToApiFormat } from '~/lib/device-transform'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'
import {
	BoxesQuerySchema,
	CreateBoxSchema,
} from '~/services/device-service.server'

import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

const messages = {
	invalidJwt: 'Invalid JWT authorization. Please sign in to obtain new JWT.',
	invalidJson: 'Invalid JSON in request body',
	invalidRequestData: 'Invalid request data',
	invalidFormat: 'Invalid format parameter',
	methodNotAllowed: 'Method Not Allowed',
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

const BoxesQueryParamsSchema = BoxesQuerySchema.meta({
	id: 'BoxesQueryParams',
	description: 'Query parameters used to filter and format the boxes response.',
})

const CreateBoxRequestSchema = CreateBoxSchema.meta({
	id: 'CreateBoxRequest',
	description: 'Payload for creating a new box/device.',
})

const GeoJsonPointSchema = z
	.object({
		type: z.literal('Point'),
		coordinates: z.tuple([z.number(), z.number()]).meta({
			description: '[longitude, latitude]',
			example: [13.404954, 52.520008],
		}),
	})
	.meta({
		id: 'GeoJsonPoint',
		description: 'GeoJSON Point geometry.',
	})

const SensorSchema = z
	.looseObject({
		_id: z.string().optional().meta({
			description: 'Sensor id in API format',
			example: 'sensor123',
		}),
		id: z.string().optional().meta({
			description: 'Sensor id',
			example: 'sensor123',
		}),
		title: z.string().nullable().optional().meta({
			description: 'Sensor title',
			example: 'Temperature',
		}),
		unit: z.string().nullable().optional().meta({
			description: 'Sensor unit',
			example: '°C',
		}),
		sensorType: z.string().nullable().optional().meta({
			description: 'Sensor type',
			example: 'HDC1080',
		}),
		lastMeasurement: z
			.object({
				createdAt: z.string().datetime().optional().meta({
					example: '2023-01-01T00:00:00.000Z',
				}),
				value: z.union([z.string(), z.number()]).nullable().optional().meta({
					example: '25.13',
				}),
			})
			.nullable()
			.optional(),
	})
	.meta({
		id: 'BoxSensor',
		description: 'Sensor belonging to a box/device.',
	})

const BoxSchema = z
	.looseObject({
		_id: z.string().optional().meta({
			description: 'Unique box identifier in API format',
			example: 'clx1234567890abcdef',
		}),
		id: z.string().optional().meta({
			description: 'Unique device identifier',
			example: 'clx1234567890abcdef',
		}),
		name: z.string().meta({
			description: 'Box name',
			example: 'My Weather Station',
		}),
		description: z.string().nullable().optional().meta({
			description: 'Box description',
			example: 'A weather monitoring station',
		}),
		image: z.string().nullable().optional().meta({
			description: 'Box image URL',
			example: 'https://example.com/image.jpg',
		}),
		link: z.string().nullable().optional().meta({
			description: 'Box website link',
			example: 'https://example.com',
		}),
		grouptag: z
			.array(z.string())
			.optional()
			.meta({
				description: 'Box group tags',
				example: ['weather', 'outdoor'],
			}),
		exposure: z.string().nullable().optional().meta({
			description: 'Box exposure type',
			example: 'outdoor',
		}),
		model: z.string().nullable().optional().meta({
			description: 'Box model',
			example: 'homeV2Wifi',
		}),
		latitude: z.number().nullable().optional().meta({
			description: 'Box latitude',
			example: 52.520008,
		}),
		longitude: z.number().nullable().optional().meta({
			description: 'Box longitude',
			example: 13.404954,
		}),
		useAuth: z.boolean().optional().meta({
			description: 'Whether box requires authentication',
			example: true,
		}),
		public: z.boolean().optional().meta({
			description: 'Whether box is public',
			example: false,
		}),
		status: z.string().nullable().optional().meta({
			description: 'Box status',
			example: 'inactive',
		}),
		createdAt: z.string().datetime().optional().meta({
			description: 'Box creation timestamp',
			example: '2024-01-15T10:30:00.000Z',
		}),
		updatedAt: z.string().datetime().optional().meta({
			description: 'Box last update timestamp',
			example: '2024-01-15T10:30:00.000Z',
		}),
		expiresAt: z.string().datetime().nullable().optional().meta({
			description: 'Box expiration date',
			example: '2024-12-31T23:59:59.000Z',
		}),
		userId: z.string().optional().meta({
			description: 'Owner user id',
			example: 'user_123456',
		}),
		sensorWikiModel: z.string().nullable().optional().meta({
			description: 'Sensor Wiki model identifier',
			example: 'homeV2Wifi',
		}),
		currentLocation: z
			.object({
				type: z.literal('Point'),
				coordinates: z.tuple([z.number(), z.number()]),
				timestamp: z.string().datetime().optional(),
			})
			.optional()
			.meta({
				description: 'Current location as GeoJSON Point-like object',
			}),
		lastMeasurementAt: z.string().datetime().nullable().optional().meta({
			description: 'Last measurement timestamp',
			example: '2023-01-01T00:00:00.000Z',
		}),
		loc: z.array(z.looseObject({})).optional().meta({
			description: 'Location history as GeoJSON features',
		}),
		integrations: z
			.looseObject({})
			.optional()
			.meta({
				description: 'Box integrations',
				example: {
					mqtt: {
						enabled: false,
					},
				},
			}),
		sensors: z.array(SensorSchema).optional().meta({
			description: 'Sensors belonging to this box',
		}),
	})
	.meta({
		id: 'Box',
		description:
			'Box/device object. The exact shape depends on whether the response is returned directly from the database or transformed through `transformDeviceToApiFormat`.',
	})

const BoxesResponseSchema = z.array(BoxSchema).meta({
	id: 'BoxesResponse',
	description: 'List of boxes/devices.',
})

const BoxesGeoJsonResponseSchema = z
	.object({
		type: z.literal('FeatureCollection'),
		features: z.array(
			z.object({
				type: z.literal('Feature'),
				geometry: GeoJsonPointSchema,
				properties: BoxSchema,
			}),
		),
	})
	.meta({
		id: 'BoxesGeoJsonResponse',
		description:
			'GeoJSON FeatureCollection of boxes. Returned when `format=geojson`.',
		example: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [13.404954, 52.520008],
					},
					properties: {
						id: 'clx1234567890abcdef',
						name: 'My Weather Station',
					},
				},
			],
		},
	})

const CreatedBoxResponseSchema = BoxSchema.meta({
	id: 'CreatedBoxResponse',
	description:
		'Created box/device response transformed through `transformDeviceToApiFormat`.',
})

const ValidationBadRequestErrorSchema = z
	.object({
		code: z.literal('Bad Request'),
		message: z.literal(messages.invalidRequestData),
		errors: z.array(z.string()).meta({
			description: 'Validation errors returned by CreateBoxSchema',
			example: [
				'name: Required',
				'location: Expected array, received undefined',
			],
		}),
	})
	.meta({
		id: 'CreateBoxValidationError',
		description:
			'Validation error response for invalid create-box request payloads.',
	})

const BadRequestErrorSchema = z
	.union([
		standardErrorResponseSchema('Bad Request', z.literal(messages.invalidJson)),
		ValidationBadRequestErrorSchema,
	])
	.meta({
		id: 'BoxesBadRequestError',
		description:
			'Bad request response. Invalid JSON uses the standard error shape; validation errors include an `errors` array.',
	})

const ForbiddenErrorSchema = standardErrorResponseSchema(
	'Forbidden',
	z.literal(messages.invalidJwt),
).meta({
	id: 'ForbiddenError',
})

const MethodNotAllowedErrorSchema = standardErrorResponseSchema(
	'Method Not Allowed',
	z.literal(messages.methodNotAllowed),
).meta({
	id: 'MethodNotAllowedError',
})

const UnprocessableContentErrorSchema = standardErrorResponseSchema(
	'Unprocessable Content',
	z.string().meta({
		example: messages.invalidFormat,
	}),
).meta({
	id: 'UnprocessableContentError',
})

const InternalServerErrorSchema = standardErrorResponseSchema(
	'Internal Server Error',
	z.literal(messages.internal),
).meta({
	id: 'InternalServerError',
})

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['Boxes'],
		summary: 'Get boxes',
		description:
			'Find boxes/devices using query parameters. By default, a JSON array of boxes is returned. If `format=geojson`, a GeoJSON FeatureCollection is returned.',
		operationId: 'findBoxes',

		requestParams: {
			query: BoxesQueryParamsSchema,
		},

		responses: {
			200: {
				description: 'Boxes retrieved successfully',
				content: {
					'application/json': {
						schema: z.union([BoxesResponseSchema, BoxesGeoJsonResponseSchema]),
					},
				},
			},
			422: {
				description: 'Invalid query parameter',
				content: {
					'application/json': {
						schema: UnprocessableContentErrorSchema,
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

	post: {
		tags: ['Boxes'],
		summary: 'Create a new box',
		description: 'Creates a new box/device with optional sensors.',
		operationId: 'createBox',
		security: [{ bearerAuth: [] }],

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: CreateBoxRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description: 'Boxes retrieved successfully',
				content: {
					'application/json': {
						schema: BoxesResponseSchema,
					},
					'application/geo+json': {
						schema: BoxesGeoJsonResponseSchema,
					},
				},
			},
			201: {
				description: 'Box created successfully',
				content: {
					'application/json': {
						schema: CreatedBoxResponseSchema,
					},
				},
			},
			400: {
				description:
					'Bad request. This can happen when the request body is not valid JSON or does not match CreateBoxSchema.',
				content: {
					'application/json': {
						schema: BadRequestErrorSchema,
					},
				},
			},
			403: {
				description: 'Forbidden - invalid or missing JWT token',
				content: {
					'application/json': {
						schema: ForbiddenErrorSchema,
					},
				},
			},
			405: {
				description: 'Method not allowed - only POST is supported for actions',
				content: {
					'application/json': {
						schema: MethodNotAllowedErrorSchema,
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

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const queryObj = Object.fromEntries(url.searchParams)
	const parseResult = BoxesQuerySchema.safeParse(queryObj)

	if (!parseResult.success) {
		const { fieldErrors } = parseResult.error.flatten()
		if (fieldErrors.format)
			throw StandardResponse.unprocessableContent('Invalid format parameter')

		throw StandardResponse.unprocessableContent(
			`${parseResult.error.flatten()}`,
		)
	}

	const params: FindDevicesOptions = parseResult.data

	const devices = await findDevices(params)

	if (params.format === 'geojson') {
		const geojson = {
			type: 'FeatureCollection',
			features: devices.map((device: Device) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [device.longitude, device.latitude],
				},
				properties: {
					...device,
				},
			})),
		}

		return Response.json(geojson, {
			headers: {
				'Content-Type': 'application/geo+json; charset=utf-8',
			},
		})
	} else {
		return devices
	}
}

export const action = async ({ request }: Route.ActionArgs) => {
	try {
		// Check authentication
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string')
			return StandardResponse.forbidden(
				'Invalid JWT authorization. Please sign in to obtain new JWT.',
			)

		switch (request.method) {
			case 'POST':
				return await post(request, jwtResponse)
			default:
				return StandardResponse.methodNotAllowed('Method Not Allowed')
		}
	} catch (err) {
		console.error('Error in action:', err)
		return StandardResponse.internalServerError()
	}
}

async function post(request: Request, user: User) {
	try {
		// Parse and validate request body
		let requestData
		try {
			requestData = await request.json()
		} catch {
			return StandardResponse.badRequest('Invalid JSON in request body')
		}

		// Validate request data
		const validationResult = CreateBoxSchema.safeParse(requestData)
		if (!validationResult.success) {
			return Response.json(
				{
					code: 'Bad Request',
					message: 'Invalid request data',
					errors: validationResult.error.issues.map(
						(err) => `${err.path.join('.')}: ${err.message}`,
					),
				},
				{ status: 400 },
			)
		}

		const validatedData = validationResult.data
		const sensorsProvided = validatedData.sensors?.length > 0
		// Extract longitude and latitude from location array [longitude, latitude]
		const [longitude, latitude] = validatedData.location
		const newBox = await createDevice(
			{
				name: validatedData.name,
				exposure: validatedData.exposure,
				model: sensorsProvided ? undefined : validatedData.model,
				latitude: latitude,
				longitude: longitude,
				tags: validatedData.grouptag,
				sensors: sensorsProvided
					? validatedData.sensors.map((s) => ({
							title: s.title,
							sensorType: s.sensorType,
							unit: s.unit,
						}))
					: undefined,
			},
			user.id,
		)

		// Build response object using helper function
		const responseData = transformDeviceToApiFormat(newBox)

		return StandardResponse.created(responseData)
	} catch (err) {
		console.error('Error creating box:', err)
		return StandardResponse.internalServerError()
	}
}
