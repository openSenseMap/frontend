import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import {
	getBoxTransfer,
	updateBoxTransferExpiration,
} from '~/lib/transfer-service.server'
import { StandardResponse } from '~/utils/response-utils'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const jwtResponse = await getUserFromJwt(request)

	if (typeof jwtResponse === 'string')
		return StandardResponse.forbidden(
			'Invalid JWT authorization. Please sign in to obtain new JWT.',
		)

	const { deviceId } = params

	if (!deviceId) return StandardResponse.badRequest('Device ID is required')

	try {
		// Get transfer details - will throw if user doesn't own the device or transfer doesn't exist
		const transfer = await getBoxTransfer(jwtResponse.id, deviceId)

		return StandardResponse.ok({
			data: {
				id: transfer.id,
				token: transfer.token,
				boxId: transfer.boxId,
				expiresAt: transfer.expiresAt,
				createdAt: transfer.createdAt,
				updatedAt: transfer.updatedAt,
			},
		})
	} catch (err) {
		console.error('Error fetching transfer:', err)
		return handleTransferError(err)
	}
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
	const jwtResponse = await getUserFromJwt(request)

	if (typeof jwtResponse === 'string')
		return StandardResponse.forbidden(
			'Invalid JWT authorization. Please sign in to obtain new JWT.',
		)

	const { deviceId } = params

	if (!deviceId) return StandardResponse.badRequest('Device ID is required')

	if (request.method !== 'PUT') return StandardResponse.methodNotAllowed('')

	const contentType = request.headers.get('content-type')
	const isJson = contentType?.includes('application/json')

	return handleUpdateTransfer(request, jwtResponse, deviceId, isJson)
}

const handleUpdateTransfer = async (
	request: Request,
	user: any,
	deviceId: string,
	isJson: boolean | undefined,
) => {
	try {
		let token: string | undefined
		let expiresAt: string | undefined

		if (isJson) {
			const body = await request.json()
			token = body.token
			expiresAt = body.expiresAt
		} else {
			const formData = await request.formData()
			token = formData.get('token')?.toString()
			expiresAt = formData.get('expiresAt')?.toString()
		}

		if (!token) return StandardResponse.badRequest('token is required')

		if (!expiresAt) return StandardResponse.badRequest('expiresAt is required')

		const updated = await updateBoxTransferExpiration(
			user.id,
			deviceId,
			token,
			expiresAt,
		)

		return StandardResponse.ok({
			message: 'Transfer successfully updated',
			data: {
				id: updated.id,
				boxId: updated.boxId,
				token: updated.token,
				expiresAt: updated.expiresAt,
				createdAt: updated.createdAt,
				updatedAt: updated.updatedAt,
			},
		})
	} catch (err) {
		console.error('Error updating transfer:', err)
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
