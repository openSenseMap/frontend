import { type Route } from './+types/api.users.password-reset'
import { StandardResponse } from '~/lib/responses'
import { resetPassword } from '~/services/user-service.server'

import * as z from 'zod/v4'
import 'zod-openapi'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

import {
	InternalServerErrorSchema,
	createBadRequestErrorSchema,
	createForbiddenErrorSchema,
} from '~/lib/openapi/errors'

import {
	badRequestResponse,
	forbiddenResponse,
	internalServerErrorResponse,
} from '~/lib/openapi/errors'

const PasswordResetRequestSchema = z
	.object({
		password: z.string().min(8).meta({
			description: 'New password. Must be at least 8 characters long.',
			example: 'newPassword456',
			format: 'password',
		}),

		token: z.string().min(1).meta({
			description: 'Password reset token sent to the user by email.',
			example: 'pwreset_01jv7c9x8n0example',
		}),
	})
	.meta({
		id: 'PasswordResetRequest',
		description: 'Payload for resetting a password using an email token.',
	})

const PasswordResetResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		message: z
			.literal(
				'Password successfully changed. You can now login with your new password',
			)
			.default(
				'Password successfully changed. You can now login with your new password',
			),
	})
	.meta({
		id: 'PasswordResetResponse',
		description: 'Password reset success response.',
	})

const PasswordResetBadRequestErrorSchema = createBadRequestErrorSchema({
	id: 'PasswordResetBadRequestError',
	description:
		'Bad request. This can happen when the password or token is missing, or when the new password does not meet the password requirements.',
	examples: [
		'No new password specified.',
		'No password reset token specified.',
		'Password must be at least 8 characters.',
	],
})

const PasswordResetForbiddenErrorSchema = createForbiddenErrorSchema({
	id: 'PasswordResetForbiddenError',
	description:
		'Returned when the password reset token is invalid, expired, or password reset is not possible for this user.',
	examples: [
		'Password reset for this user not possible',
		'Password reset token expired',
	],
})

export const openapi: ZodOpenApiPathItemObject = {
	post: {
		tags: ['User Management'],
		summary: 'Reset password',
		description:
			'Resets a user password using a password reset token sent by email. The token is valid for the configured password-reset lifetime.',
		operationId: 'resetPassword',

		requestBody: {
			required: true,
			content: {
				'application/x-www-form-urlencoded': {
					schema: PasswordResetRequestSchema,
				},
				'multipart/form-data': {
					schema: PasswordResetRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description: 'Password changed successfully.',
				content: {
					'application/json': {
						schema: PasswordResetResponseSchema,
					},
				},
			},

			400: badRequestResponse(
				PasswordResetBadRequestErrorSchema,
				'Bad request. The password or token is missing, or the password format is invalid.',
			),

			403: forbiddenResponse(
				PasswordResetForbiddenErrorSchema,
				'Password reset is not possible because the token is invalid or expired.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

export const action = async ({ request }: Route.ActionArgs) => {
	let formData = new FormData()
	try {
		formData = await request.formData()
	} catch {
		// Just continue, it will fail in the next check
		// The try catch block handles an exception that occurs if the
		// request was sent without x-www-form-urlencoded content-type header
	}

	if (
		!formData.has('password') ||
		formData.get('password')?.toString().trim().length === 0
	)
		return StandardResponse.badRequest('No new password specified.')

	if (
		!formData.has('token') ||
		formData.get('token')?.toString().trim().length === 0
	)
		return StandardResponse.badRequest('No password reset token specified.')

	try {
		const resetStatus = await resetPassword(
			formData.get('token')!.toString(),
			formData.get('password')!.toString(),
		)

		switch (resetStatus) {
			case 'forbidden':
			case 'expired':
				return StandardResponse.forbidden(
					resetStatus === 'forbidden'
						? 'Password reset for this user not possible'
						: 'Password reset token expired',
				)
			case 'invalid_password_format':
				return StandardResponse.badRequest(
					'Password must be at least 8 characters.',
				)
			case 'success':
				return StandardResponse.ok({
					code: 'Ok',
					message:
						'Password successfully changed. You can now login with your new password',
				})
		}
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
