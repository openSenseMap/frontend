import { type Route } from './+types/api.boxes.$deviceId'
import {
	DeviceUpdateError,
	getDevice,
	updateDevice,
	type UpdateDeviceArgs,
} from '~/db/models/device.server'
import { type Device, type User } from '~/db/schema'
import { transformDeviceToApiFormat } from '~/lib/device-transform'
import { getAuthenticatedUser } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'
import { deleteDevice } from '~/services/device-service.server'
import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import {
	BadRequestErrorSchema,
	badRequestResponse,
	createBadRequestErrorSchema,
	ForbiddenErrorSchema,
	forbiddenResponse,
	internalServerErrorResponse,
	InternalServerErrorSchema,
	NotFoundErrorSchema,
	notFoundResponse,
	UnauthorizedErrorSchema,
	unauthorizedResponse,
} from '~/lib/openapi/errors'
import { DevicePathParamsSchema } from '~/lib/openapi/schemas/common'
import { apiMessages } from '~/lib/openapi/messages'
import {
	DeviceLocationInputSchema,
	DeviceSensorUpdateSchema,
	DeviceAddonsUpdateSchema,
	ApiDeviceSchema,
} from '~/lib/openapi/schemas/device'
import { ExposureSchema } from '~/lib/api-schemas/query'
import {
	requestContentTypeJson,
	responseContentTypeJson,
} from '~/middleware/content-type-header.server'
import { parseJsonBody } from '~/lib/request-parsing'

const messages = {
	conflictingSensorsAndAddons:
		'sensors and addons can not appear in the same request.',
}

const UpdateDeviceRequestSchema = z
	.object({
		name: z.string().optional().meta({
			description: 'Device name',
			example: 'My device',
		}),

		exposure: ExposureSchema,

		description: z.string().optional().meta({
			description: 'Device description',
			example: 'Sensor device on my balcony',
		}),

		image: z.string().optional().meta({
			description: 'Device image URL or image value',
		}),

		deleteImage: z.boolean().optional().meta({
			description: 'If true, the device image is removed.',
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
			description: 'Web link for the device.',
			example: 'https://example.com',
		}),

		location: DeviceLocationInputSchema.optional(),

		grouptag: z
			.array(z.string())
			.optional()
			.meta({
				description: 'Group tags assigned to the device',
				example: ['school', 'feinstaub'],
			}),

		sensors: z.array(DeviceSensorUpdateSchema).optional().meta({
			description:
				'Sensors to update or create. Must not be used together with `addons.add`.',
		}),

		addons: DeviceAddonsUpdateSchema.optional(),
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
		password: z
			.string()
			.min(1, {
				error: apiMessages.passwordRequired,
			})
			.meta({
				description: 'Current user password required to delete the device',
				example: 'myCurrentPassword123',
				format: 'password',
			}),
	})
	.meta({
		id: 'DeleteDeviceRequest',
		description: 'Device deletion confirmation payload.',
	})

const DeviceBadRequestErrorSchema = createBadRequestErrorSchema({
	id: 'DeviceBadRequestError',
	description:
		'Bad request. This can happen when the device id is missing, the deletion password is missing, or the update payload contains conflicting fields.',
	examples: [
		apiMessages.deviceIdRequired,
		apiMessages.passwordRequired,
		messages.conflictingSensorsAndAddons,
	],
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
				description: 'Device retrieved successfully.',
				content: {
					'application/json': {
						schema: ApiDeviceSchema,
					},
				},
			},

			400: badRequestResponse(
				BadRequestErrorSchema,
				'Bad request. The device ID path parameter is missing or malformed.',
			),

			404: notFoundResponse(NotFoundErrorSchema, 'Device not found.'),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},

	put: {
		tags: ['Boxes'],
		summary: 'Update device',
		description: 'Updates a device. Requires JWT authorization.',
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
				description: 'Device updated successfully.',
				content: {
					'application/json': {
						schema: ApiDeviceSchema,
					},
				},
			},

			400: badRequestResponse(
				DeviceBadRequestErrorSchema,
				'Bad request. This can happen for conflicting parameters or validation errors.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid or missing JWT authorization.',
			),

			404: notFoundResponse(NotFoundErrorSchema, 'Device not found.'),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
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
				description: 'Device deleted successfully.',
				content: {
					'application/json': {
						schema: z.null().meta({
							description: 'JSON null response indicating successful deletion.',
						}),
					},
				},
			},

			400: badRequestResponse(
				DeviceBadRequestErrorSchema,
				'Bad request. This can happen when the password is missing.',
			),

			401: unauthorizedResponse(
				UnauthorizedErrorSchema,
				'Unauthorized. The provided password is incorrect.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid or missing JWT authorization.',
			),

			404: notFoundResponse(NotFoundErrorSchema, 'Device not found.'),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

const parsePathParams = (params: Route.LoaderArgs['params']) => {
	const parsed = DevicePathParamsSchema.safeParse(params)

	if (!parsed.success) {
		return StandardResponse.badRequest(apiMessages.deviceIdRequired)
	}

	return parsed.data
}

const okDeviceResponse = async (device: unknown) => {
	const apiDevice = transformDeviceToApiFormat(device as any)
	const parsed = await ApiDeviceSchema.safeParseAsync(apiDevice)

	if (!parsed.success) {
		console.warn(parsed.error)
		return StandardResponse.internalServerError()
	}

	return StandardResponse.ok(parsed.data)
}

export const middleware: Route.MiddlewareFunction[] = [
	requestContentTypeJson(['PUT', 'DELETE']),
	responseContentTypeJson,
]

export async function loader({ params }: Route.LoaderArgs) {
	const { deviceId } = params

	if (!deviceId) return StandardResponse.badRequest('Device ID is required.')

	try {
		const device = await getDevice({ id: deviceId })

		if (!device) return StandardResponse.notFound('Device not found.')

		return await okDeviceResponse(device)
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
	const parsedParams = parsePathParams(params)
	if (parsedParams instanceof Response) return parsedParams

	const user = await getAuthenticatedUser(request)
	if (user instanceof Response) return user

	switch (request.method) {
		case 'PUT':
			return await put(request, user, parsedParams.deviceId)

		case 'DELETE':
			return await del(request, user, parsedParams.deviceId)

		default:
			return StandardResponse.methodNotAllowed('Method Not Allowed')
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
	const device = await getDevice({ id: deviceId })

	if (!device) {
		return StandardResponse.notFound('Device not found')
	}

	const parsedBody = await parseJsonBody(request, DeleteDeviceRequestSchema)
	if (parsedBody instanceof Response) return parsedBody

	try {
		const deleted = await deleteDevice(
			user,
			device as Device,
			parsedBody.password,
		)

		if (deleted === 'unauthorized') {
			return StandardResponse.unauthorized('Password incorrect')
		}

		return StandardResponse.ok(null)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
