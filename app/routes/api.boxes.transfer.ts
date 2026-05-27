import { type Route } from './+types/api.boxes.transfer'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'
import {
	createBoxTransfer,
	removeBoxTransfer,
	validateTransferParams,
} from '~/services/transfer-service.server'

import * as z from 'zod/v4'
import 'zod-openapi'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

import {
	ForbiddenErrorSchema,
	InternalServerErrorSchema,
	MethodNotAllowedErrorSchema,
	NotFoundErrorSchema,
	createBadRequestErrorSchema,
} from '~/lib/openapi/errors'

import {
	badRequestResponse,
	forbiddenResponse,
	internalServerErrorResponse,
	methodNotAllowedResponse,
	notFoundResponse,
} from '~/lib/openapi/errors'

const TransferTokenSchema = z.string().min(1).meta({
	description: 'Transfer token used to claim or revoke the device transfer.',
	example: 'clm_01jv7c9x8n0example',
})

const CreateBoxTransferRequestSchema = z
	.object({
		boxId: z.string().min(1).meta({
			description: 'ID of the device to mark for transfer.',
			example: '5bdbe70f55d0ad001a04edc9',
		}),

		expiresAt: z.iso.datetime().optional().meta({
			description:
				'Expiration date for the transfer token. If omitted, the default is 24 hours from now.',
			example: '2026-05-22T12:00:00.000Z',
		}),
	})
	.meta({
		id: 'CreateBoxTransferRequest',
		description: 'Payload for marking a device for transfer.',
	})

const RemoveBoxTransferRequestSchema = z
	.object({
		boxId: z.string().min(1).meta({
			description: 'ID of the device to remove from transfer.',
			example: '5bdbe70f55d0ad001a04edc9',
		}),

		token: TransferTokenSchema,
	})
	.meta({
		id: 'RemoveBoxTransferRequest',
		description: 'Payload for revoking a device transfer token.',
	})

const CreateBoxTransferResponseSchema = z
	.object({
		code: z.literal('Created').default('Created'),
		message: z
			.literal('Device successfully prepared for transfer')
			.default('Device successfully prepared for transfer'),
		data: TransferTokenSchema.meta({
			description: 'Generated transfer token.',
		}),
	})
	.meta({
		id: 'CreateBoxTransferResponse',
		description: 'Response returned after creating a transfer token.',
	})

const BoxTransferBadRequestErrorSchema = createBadRequestErrorSchema({
	id: 'BoxTransferBadRequestError',
	description:
		'Bad request. This can happen when required parameters are missing, the expiration date has an invalid format, the expiration date is not in the future, or the transfer token is invalid or expired.',
	examples: [
		'boxId is required',
		'token is required',
		'Invalid date format',
		'Expiration date must be in the future',
		'Invalid or expired transfer token',
	],
})

export const openapi: ZodOpenApiPathItemObject = {
	post: {
		tags: ['Boxes'],
		summary: 'Mark a device for transfer',
		description:
			'Marks a device for transfer to another user account and returns a transfer token. Requires JWT authorization. The request body can be sent as JSON or form data. `date` is supported as a legacy alias for `expiresAt`.',
		operationId: 'createBoxTransfer',
		security: [{ bearerAuth: [] }],

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: CreateBoxTransferRequestSchema,
				},
				'application/x-www-form-urlencoded': {
					schema: CreateBoxTransferRequestSchema,
				},
			},
		},

		responses: {
			201: {
				description: 'Box successfully prepared for transfer.',
				content: {
					'application/json': {
						schema: CreateBoxTransferResponseSchema,
					},
				},
			},

			400: badRequestResponse(
				BoxTransferBadRequestErrorSchema,
				'Bad request. This can happen when required parameters are missing or invalid.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid JWT authorization or the authenticated user is not allowed to transfer this box.',
			),

			404: notFoundResponse(
				NotFoundErrorSchema,
				'Box or transfer record not found.',
			),

			405: methodNotAllowedResponse(
				MethodNotAllowedErrorSchema,
				'Method not allowed. Only POST and DELETE are supported.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},

	delete: {
		tags: ['Boxes'],
		summary: 'Revoke a device transfer token',
		description:
			'Revokes a transfer token and removes the device from transfer. Requires JWT authorization. The request body can be sent as JSON or form data.',
		operationId: 'removeBoxTransfer',
		security: [{ bearerAuth: [] }],

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: RemoveBoxTransferRequestSchema,
				},
				'application/x-www-form-urlencoded': {
					schema: RemoveBoxTransferRequestSchema,
				},
			},
		},

		responses: {
			204: {
				description: 'Transfer token revoked successfully.',
			},

			400: badRequestResponse(
				BoxTransferBadRequestErrorSchema,
				'Bad request. This can happen when `boxId` or `token` is missing or invalid.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid JWT authorization or the authenticated user is not allowed to revoke this transfer.',
			),

			404: notFoundResponse(
				NotFoundErrorSchema,
				'Box or transfer record not found.',
			),

			405: methodNotAllowedResponse(
				MethodNotAllowedErrorSchema,
				'Method not allowed. Only POST and DELETE are supported.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

export const action = async ({ request }: Route.ActionArgs) => {
	const jwtResponse = await getUserFromJwt(request)

	if (typeof jwtResponse === 'string')
		return StandardResponse.forbidden(
			'Invalid JWT authorization. Please sign in to obtain new JWT.',
		)

	if (request.method !== 'POST' && request.method !== 'DELETE')
		return StandardResponse.methodNotAllowed('')

	switch (request.method) {
		case 'POST': {
			return handleCreateTransfer(request, jwtResponse)
		}
		case 'DELETE': {
			return handleRemoveTransfer(request, jwtResponse)
		}
	}
}

const handleCreateTransfer = async (request: Request, user: any) => {
	try {
		let boxId: string | undefined
		let expiresAt: string | undefined

		const contentType = request.headers.get('content-type')
		if (contentType?.includes('application/json')) {
			const body = await request.json()
			boxId = body.boxId
			expiresAt = body.expiresAt || body.date // Support both param names for backwards compatibility
		} else {
			const formData = await request.formData()
			boxId = formData.get('boxId')?.toString()
			expiresAt =
				formData.get('expiresAt')?.toString() ||
				formData.get('date')?.toString()
		}

		const validation = validateTransferParams(boxId, expiresAt)
		if (!validation.isValid)
			return StandardResponse.badRequest(validation.error ?? '')

		const transferCode = await createBoxTransfer(user.id, boxId!, expiresAt)

		return StandardResponse.created({
			message: 'Box successfully prepared for transfer',
			data: transferCode,
		})
	} catch (err) {
		console.error('Error creating transfer:', err)
		return handleTransferError(err)
	}
}

const handleRemoveTransfer = async (request: Request, user: any) => {
	try {
		let boxId: string | undefined
		let token: string | undefined

		const contentType = request.headers.get('content-type')
		if (contentType?.includes('application/json')) {
			const body = await request.json()
			boxId = body.boxId
			token = body.token
		} else {
			const formData = await request.formData()
			boxId = formData.get('boxId')?.toString()
			token = formData.get('token')?.toString()
		}

		if (!boxId) return StandardResponse.badRequest('boxId is required')

		if (!token) return StandardResponse.badRequest('token is required')

		await removeBoxTransfer(user.id, boxId, token)

		return StandardResponse.noContent()
	} catch (err) {
		console.error('Error removing transfer:', err)
		return handleTransferError(err)
	}
}

const handleTransferError = (err: unknown) => {
	if (err instanceof Error) {
		const message = err.message

		if (message.includes('not found')) return StandardResponse.notFound(message)

		if (
			message.includes('permission') ||
			message.includes("don't have") ||
			message.includes('not the owner')
		)
			return StandardResponse.forbidden(message)

		if (
			message.includes('expired') ||
			message.includes('Invalid') ||
			message.includes('required') ||
			message.includes('format') ||
			message.includes('future')
		)
			return StandardResponse.badRequest(message)
	}

	return StandardResponse.internalServerError()
}
