import { type Route } from './+types/api.users.me.boxes.$deviceId'
import { getDevice } from '~/db/models/device.server'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'

import * as z from 'zod/v4'
import 'zod-openapi'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

import { DevicePathParamsSchema } from '~/lib/openapi/schemas/common'
import { ApiDeviceSchema } from '~/lib/openapi/schemas/device'

import {
	BadRequestErrorSchema,
	ForbiddenErrorSchema,
	InternalServerErrorSchema,
} from '~/lib/openapi/errors'

import {
	badRequestResponse,
	forbiddenResponse,
	internalServerErrorResponse,
} from '~/lib/openapi/errors'

const CurrentUserPrivateBoxSchema = ApiDeviceSchema.meta({
	id: 'CurrentUserPrivateBox',
	description:
		'Box owned by the authenticated user. This response may include private or secret fields.',
})

const GetCurrentUserBoxResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		data: z.object({
			box: CurrentUserPrivateBoxSchema,
		}),
	})
	.meta({
		id: 'GetCurrentUserBoxResponse',
		description: 'Response containing one box owned by the authenticated user.',
	})

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['User Management'],
		summary: 'Get one box of the current user',
		description:
			'Returns a specific box owned by the authenticated user. This endpoint may include private or secret fields that are not returned by public box endpoints.',
		operationId: 'getCurrentUserBox',
		security: [{ bearerAuth: [] }],

		requestParams: {
			path: DevicePathParamsSchema,
		},

		responses: {
			200: {
				description: 'Box returned successfully.',
				content: {
					'application/json': {
						schema: GetCurrentUserBoxResponseSchema,
					},
				},
			},

			400: badRequestResponse(
				BadRequestErrorSchema,
				'Bad request. The device ID is missing, invalid, or no device exists for the given ID.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid JWT authorization or the authenticated user does not own this senseBox.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string')
			return StandardResponse.forbidden(
				'Invalid JWT authorization. Please sign in to obtain new JWT.',
			)
		const user = jwtResponse

		const deviceId = params.deviceId
		if (deviceId === undefined)
			return StandardResponse.badRequest('Invalid device id specified')

		const box = await getDevice({ id: deviceId })
		if (box === undefined)
			return StandardResponse.badRequest(
				'There is no such device with the given id',
			)

		if (box.user.id !== user.id)
			return StandardResponse.forbidden('User does not own this senseBox')

		return StandardResponse.ok({ code: 'Ok', data: { box: box } })
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
