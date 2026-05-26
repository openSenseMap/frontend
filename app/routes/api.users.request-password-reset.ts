import { type Route } from './+types/api.users.request-password-reset'
import { StandardResponse } from '~/lib/responses'
import { requestPasswordReset } from '~/services/user-service.server'

import * as z from 'zod/v4'
import 'zod-openapi'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

import {
	BadRequestErrorSchema,
	InternalServerErrorSchema,
} from '~/lib/openapi/errors'

import {
	badRequestResponse,
	internalServerErrorResponse,
} from '~/lib/openapi/errors'

const RequestPasswordResetRequestSchema = z
	.object({
		email: z.string().trim().pipe(z.email()).meta({
			description: 'Email address of the user requesting a password reset.',
			example: 'user@example.com',
		}),
	})
	.meta({
		id: 'RequestPasswordResetRequest',
		description: 'Payload for requesting a password reset.',
	})

const RequestPasswordResetResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		message: z
			.literal('Password reset initiated')
			.default('Password reset initiated'),
	})
	.meta({
		id: 'RequestPasswordResetResponse',
		description:
			'Password reset initiation response. This response is returned regardless of whether the email address belongs to an existing user.',
	})

export const openapi: ZodOpenApiPathItemObject = {
	post: {
		tags: ['User Management'],
		summary: 'Request a password reset',
		description:
			'Requests a password reset for the given email address. If the email address belongs to a user, an email with reset instructions is sent. To avoid leaking whether an email address exists, a successful response is returned regardless of whether the address is known.',
		operationId: 'requestPasswordReset',

		requestBody: {
			required: true,
			content: {
				'application/x-www-form-urlencoded': {
					schema: RequestPasswordResetRequestSchema,
				},
				'multipart/form-data': {
					schema: RequestPasswordResetRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description: 'Password reset initiated.',
				content: {
					'application/json': {
						schema: RequestPasswordResetResponseSchema,
					},
				},
			},

			400: badRequestResponse(
				BadRequestErrorSchema,
				'Bad request. The email field is missing or empty.',
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

	const email = formData.get('email')?.toString().trim()

	if (!email) {
		return StandardResponse.badRequest('No email address specified.')
	}

	const parsedEmail = z.email().safeParse(email)

	if (!parsedEmail.success) {
		return StandardResponse.badRequest('Invalid email address.')
	}

	try {
		await requestPasswordReset(parsedEmail.data)

		// We don't want to leak valid/ invalid emails, so we confirm
		// the initiation no matter what the return value above is
		return StandardResponse.ok({
			code: 'Ok',
			message: 'Password reset initiated',
		})
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
