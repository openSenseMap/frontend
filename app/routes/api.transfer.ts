import { type ActionFunctionArgs } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import {
	createBoxTransfer,
	removeBoxTransfer,
	validateTransferParams,
} from '~/lib/transfer-service.server'
import { StandardResponse } from '~/utils/response-utils'

export const action = async ({ request }: ActionFunctionArgs) => {
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
