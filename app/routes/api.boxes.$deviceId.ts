import { type Route } from './+types/api.boxes.$deviceId'
import {
	DeviceUpdateError,
	getDevice,
	updateDevice,
	type UpdateDeviceArgs,
} from '~/db/models/device.server'
import { type Device, type User } from '~/db/schema'
import { transformDeviceToApiFormat } from '~/lib/device-transform'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'
import { deleteDevice } from '~/services/device-service.server'
import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

const messages = {
	deviceIdRequired: 'Device ID is required.',
	deviceNotFound: 'Device not found.',
	invalidJwt: 'Invalid JWT authorization. Please sign in to obtain a new JWT.',
	passwordRequired: 'Password is required for device deletion',
	passwordIncorrect: 'Password incorrect',
	conflictingSensorsAndAddons:
		'sensors and addons can not appear in the same request.',
	internalFetching: 'Internal server error while fetching box',
	internalDefault:
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

const DevicePathParamsSchema = z.object({
	deviceId: z.string().min(1).meta({
		description: 'Unique identifier of the device',
		example: '5bdbe70f55d0ad001a04edc9',
	}),
})

const LocationInputSchema = z
	.object({
		lat: z.number().meta({
			description: 'Latitude',
			example: 51.9607,
		}),
		lng: z.number().meta({
			description: 'Longitude',
			example: 7.6261,
		}),
		height: z.number().optional().meta({
			description: 'Optional height in meters',
			example: 55,
		}),
	})
	.meta({
		id: 'DeviceLocationInput',
		description: 'Device location update payload.',
	})

const SensorUpdateSchema = z
	.looseObject({
		id: z.string().optional().meta({
			description: 'Existing sensor id. Omit when creating a new sensor.',
			example: '60a13611a877b3001b8ffd59',
		}),
		new: z.boolean().optional().meta({
			description: 'Whether this sensor should be created as new.',
			example: true,
		}),
		title: z.string().optional().meta({
			example: 'PM10',
		}),
		unit: z.string().optional().meta({
			example: 'µg/m³',
		}),
		sensorType: z.string().optional().meta({
			example: 'SDS 011',
		}),
	})
	.meta({
		id: 'SensorUpdate',
		description: 'Sensor update or creation payload.',
	})

const DeviceAddonsSchema = z
	.object({
		add: z.string().optional().meta({
			description:
				'Addon to add to the device. The special value `feinstaub` may update the model and add PM sensors for compatible home models.',
			example: 'feinstaub',
		}),
	})
	.meta({
		id: 'DeviceAddonsUpdate',
		description: 'Legacy addon update payload.',
	})

const UpdateDeviceRequestSchema = z
	.object({
		name: z.string().optional().meta({
			description: 'Device name',
			example: 'My senseBox',
		}),
		exposure: z.string().optional().meta({
			description: 'Device exposure',
			example: 'outdoor',
		}),
		description: z.string().optional().meta({
			description: 'Device description',
			example: 'Sensor box on my balcony',
		}),
		image: z.string().optional().meta({
			description: 'Device image URL or image value',
			example: 'https://example.com/image.jpg',
		}),
		deleteImage: z.boolean().optional().meta({
			description:
				'If true, the device image is removed by setting `image` to an empty string.',
			example: true,
		}),
		model: z.string().optional().meta({
			description: 'Device model',
			example: 'homeWifi',
		}),
		useAuth: z.boolean().optional().meta({
			description: 'Whether device API-key authentication is enabled',
			example: true,
		}),
		weblink: z.string().optional().meta({
			description:
				'Web link for the device. This is mapped to `link` internally.',
			example: 'https://example.com',
		}),
		location: LocationInputSchema.optional(),
		grouptag: z
			.array(z.string())
			.optional()
			.meta({
				description: 'Group tags assigned to the device',
				example: ['school', 'feinstaub'],
			}),
		sensors: z.array(SensorUpdateSchema).optional().meta({
			description:
				'Sensors to update or create. Must not be used together with `addons.add`.',
		}),
		addons: DeviceAddonsSchema.optional(),
	})
	.superRefine((body, ctx) => {
		if (body.sensors && body.addons?.add) {
			ctx.addIssue({
				code: 'custom',
				path: ['sensors'],
				message: messages.conflictingSensorsAndAddons,
			})
		}
	})
	.meta({
		id: 'UpdateDeviceRequest',
		description: 'Device update payload.',
	})

const DeleteDeviceRequestSchema = z
	.object({
		password: z.string().min(1, messages.passwordRequired).meta({
			description: 'Current user password required to delete the device',
			example: 'myCurrentPassword123',
			format: 'password',
		}),
	})
	.meta({
		id: 'DeleteDeviceRequest',
		description: 'Device deletion confirmation payload.',
	})

const DeviceSchema = z
	.looseObject({
		id: z.string().meta({
			description: 'Device id',
			example: '5bdbe70f55d0ad001a04edc9',
		}),
		name: z.string().optional().meta({
			description: 'Device name',
			example: 'My senseBox',
		}),
		exposure: z.string().optional().meta({
			description: 'Device exposure',
			example: 'outdoor',
		}),
		description: z.string().nullable().optional().meta({
			description: 'Device description',
			example: 'Sensor box on my balcony',
		}),
		model: z.string().nullable().optional().meta({
			description: 'Device model',
			example: 'homeWifi',
		}),
		useAuth: z.boolean().optional().meta({
			description: 'Whether device API-key authentication is enabled',
			example: true,
		}),
		sensors: z.array(z.looseObject({})).optional().meta({
			description: 'Sensors belonging to this device',
		}),
		createdAt: z.string().datetime().optional().meta({
			description: 'Device creation timestamp',
			example: '2026-05-15T12:00:00.000Z',
		}),
		updatedAt: z.string().datetime().optional().meta({
			description: 'Device update timestamp',
			example: '2026-05-15T12:00:00.000Z',
		}),
	})
	.meta({
		id: 'Device',
		description:
			'Device object. Additional fields may be included depending on the database model.',
	})

const ApiDeviceSchema = DeviceSchema.meta({
	id: 'ApiDevice',
	description:
		'Device object transformed to API format. Additional fields may be included depending on `transformDeviceToApiFormat`.',
})

const BadRequestErrorSchema = z
	.union([
		standardErrorResponseSchema(
			'Bad Request',
			z.union([
				z.literal(messages.deviceIdRequired),
				z.literal(messages.passwordRequired),
			]),
		),
		z.object({
			error: z.literal(messages.deviceIdRequired),
		}),
		z.object({
			code: z.literal('BadRequest'),
			message: z.string().meta({
				example: messages.conflictingSensorsAndAddons,
			}),
		}),
	])
	.meta({
		id: 'DeviceBadRequestError',
		description:
			'Bad request response. This route currently returns a few different bad-request shapes.',
	})

const ForbiddenErrorSchema = z
	.object({
		code: z.literal('Forbidden'),
		message: z.literal(messages.invalidJwt),
	})
	.meta({
		id: 'DeviceForbiddenError',
		description:
			'Returned when the JWT authorization is invalid or missing for authenticated methods.',
	})

const UnauthorizedErrorSchema = standardErrorResponseSchema(
	'Unauthorized',
	z.literal(messages.passwordIncorrect),
).meta({
	id: 'DeviceUnauthorizedError',
})

const NotFoundErrorSchema = z
	.union([
		standardErrorResponseSchema(
			'Not Found',
			z.literal(messages.deviceNotFound),
		),
		z.object({
			code: z.literal('NotFound'),
			message: z.literal('Device not found'),
		}),
	])
	.meta({
		id: 'DeviceNotFoundError',
		description:
			'Device not found response. GET/DELETE and PUT currently use slightly different shapes.',
	})

const MethodNotAllowedErrorSchema = z
	.object({
		message: z.literal('Method Not Allowed'),
	})
	.meta({
		id: 'MethodNotAllowedError',
	})

const InternalServerErrorSchema = z
	.union([
		standardErrorResponseSchema(
			'Internal Server Error',
			z.string().meta({
				example: messages.internalDefault,
			}),
		),
		z.object({
			error: z.literal(messages.internalFetching),
		}),
		z.object({
			code: z.literal('InternalServerError'),
			message: z.string().meta({
				example: 'Failed to update device',
			}),
		}),
	])
	.meta({
		id: 'DeviceInternalServerError',
		description:
			'Internal server error response. This route currently returns different error shapes depending on the failing method.',
	})

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['Boxes'],
		summary: 'Get device by ID',
		description: 'Retrieve a single device by its unique identifier.',
		operationId: 'getDeviceById',

		requestParams: {
			path: DevicePathParamsSchema,
		},

		responses: {
			200: {
				description: 'Device retrieved successfully',
				content: {
					'application/json': {
						schema: DeviceSchema,
					},
				},
			},
			400: {
				description: 'Device ID is required',
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

	put: {
		tags: ['Boxes'],
		summary: 'Update device',
		description:
			'Updates a device. Requires JWT authorization. Supports legacy addon behavior, image deletion, location updates, group tag updates, and sensor updates.',
		operationId: 'updateDevice',
		security: [{ bearerAuth: [] }],

		requestParams: {
			path: DevicePathParamsSchema,
		},

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: UpdateDeviceRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description: 'Device updated successfully',
				content: {
					'application/json': {
						schema: ApiDeviceSchema,
					},
				},
			},
			400: {
				description:
					'Bad request. This can happen for conflicting parameters or validation errors.',
				content: {
					'application/json': {
						schema: BadRequestErrorSchema,
					},
				},
			},
			403: {
				description: 'Invalid or missing JWT authorization',
				content: {
					'application/json': {
						schema: ForbiddenErrorSchema,
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

	delete: {
		tags: ['Boxes'],
		summary: 'Delete device',
		description:
			'Deletes a device. Requires JWT authorization and the current user password.',
		operationId: 'deleteDevice',
		security: [{ bearerAuth: [] }],

		requestParams: {
			path: DevicePathParamsSchema,
		},

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: DeleteDeviceRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description: 'Device deleted successfully',
				content: {
					'application/json': {
						schema: z.null().meta({
							description: 'JSON null response indicating successful deletion.',
						}),
					},
				},
			},
			400: {
				description: 'Bad request - missing device id or password',
				content: {
					'application/json': {
						schema: BadRequestErrorSchema,
					},
				},
			},
			401: {
				description: 'Unauthorized - incorrect password',
				content: {
					'application/json': {
						schema: UnauthorizedErrorSchema,
					},
				},
			},
			403: {
				description: 'Invalid or missing JWT authorization',
				content: {
					'application/json': {
						schema: ForbiddenErrorSchema,
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

export async function loader({ params }: Route.LoaderArgs) {
	const { deviceId } = params

	if (!deviceId) return StandardResponse.badRequest('Device ID is required.')

	try {
		const device = await getDevice({ id: deviceId })

		if (!device) return StandardResponse.notFound('Device not found.')

		return StandardResponse.ok(device)
	} catch (error) {
		console.error('Error fetching box:', error)

		if (error instanceof Response) {
			throw error
		}

		return new Response(
			JSON.stringify({ error: 'Internal server error while fetching box' }),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
				},
			},
		)
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const { deviceId } = params

	if (!deviceId) {
		return Response.json({ error: 'Device ID is required.' }, { status: 400 })
	}

	const jwtResponse = await getUserFromJwt(request)

	if (typeof jwtResponse === 'string') {
		return Response.json(
			{
				code: 'Forbidden',
				message:
					'Invalid JWT authorization. Please sign in to obtain a new JWT.',
			},
			{ status: 403 },
		)
	}

	switch (request.method) {
		case 'PUT':
			return await put(request, jwtResponse, deviceId)
		case 'DELETE':
			return await del(request, jwtResponse, deviceId)
		default:
			return Response.json({ message: 'Method Not Allowed' }, { status: 405 })
	}
}

async function put(request: Request, user: any, deviceId: string) {
	const body = await request.json()

	const currentDevice = await getDevice({ id: deviceId })
	if (!currentDevice) {
		return Response.json(
			{ code: 'NotFound', message: 'Device not found' },
			{ status: 404 },
		)
	}

	// Check for conflicting parameters (backwards compatibility)
	if (body.sensors && body.addons?.add) {
		return Response.json(
			{
				code: 'BadRequest',
				message: 'sensors and addons can not appear in the same request.',
			},
			{ status: 400 },
		)
	}

	if (body.addons?.add === 'feinstaub') {
		const homeModels = ['homeWifi', 'homeEthernet']
		if (currentDevice.model && homeModels.includes(currentDevice.model)) {
			body.model = `${currentDevice.model}Feinstaub`

			const hasPM10 = currentDevice.sensors.some(
				(s) => s.sensorType === 'SDS 011' && s.title === 'PM10',
			)
			const hasPM25 = currentDevice.sensors.some(
				(s) => s.sensorType === 'SDS 011' && s.title === 'PM2.5',
			)

			if (!hasPM10 || !hasPM25) {
				body.sensors = [
					...(body.sensors ?? []),
					!hasPM10 && {
						new: true,
						title: 'PM10',
						unit: 'µg/m³',
						sensorType: 'SDS 011',
						// icon: 'osem-cloud',
					},
					!hasPM25 && {
						new: true,
						title: 'PM2.5',
						unit: 'µg/m³',
						sensorType: 'SDS 011',
						// icon: 'osem-cloud',
					},
				].filter(Boolean)
			}
		}
	}

	// Handle addons (merge with grouptag)
	if (body.addons?.add) {
		const currentTags = Array.isArray(body.grouptag) ? body.grouptag : []
		body.grouptag = Array.from(new Set([...currentTags, body.addons.add]))
	}

	// Handle image deletion
	if (body.deleteImage === true) {
		body.image = ''
	}

	// Prepare location if provided
	let locationData: { lat: number; lng: number; height?: number } | undefined
	if (body.location) {
		locationData = {
			lat: body.location.lat,
			lng: body.location.lng,
		}
		if (body.location.height !== undefined) {
			locationData.height = body.location.height
		}
	}

	const updateArgs: UpdateDeviceArgs = {
		name: body.name,
		exposure: body.exposure,
		description: body.description,
		image: body.image,
		model: body.model,
		useAuth: body.useAuth,
		link: body.weblink,
		location: locationData,
		grouptag: body.grouptag,
		sensors: body.sensors,
	}

	try {
		const updatedDevice = await updateDevice(deviceId, updateArgs)

		const deviceWithSensors = await getDevice({ id: updatedDevice.id })

		const apiResponse = transformDeviceToApiFormat(deviceWithSensors as any)

		return Response.json(apiResponse, { status: 200 })
	} catch (error) {
		console.error('Error updating device:', error)

		// Handle specific device update errors
		if (error instanceof DeviceUpdateError) {
			return Response.json(
				{
					code: error.statusCode === 400 ? 'BadRequest' : 'NotFound',
					message: error.message,
				},
				{ status: error.statusCode },
			)
		}

		// Return generic error for unexpected errors
		return Response.json(
			{
				code: 'InternalServerError',
				message:
					error instanceof Error ? error.message : 'Failed to update device',
			},
			{ status: 500 },
		)
	}
}

async function del(request: Request, user: User, deviceId: string) {
	const device = (await getDevice({ id: deviceId })) as unknown as Device

	if (!device) throw StandardResponse.notFound('Device not found')

	const body = await request.json()

	if (!body.password)
		throw StandardResponse.badRequest(
			'Password is required for device deletion',
		)

	try {
		const deleted = await deleteDevice(user, device, body.password)

		if (deleted === 'unauthorized')
			return StandardResponse.unauthorized('Password incorrect')

		return StandardResponse.ok(null)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
