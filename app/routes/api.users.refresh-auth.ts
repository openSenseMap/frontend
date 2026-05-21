import { type Route } from './+types/api.users.refresh-auth'
import { type User } from '~/db/schema'
import { getUserFromJwt, hashJwt, refreshJwt } from '~/lib/jwt'
import { parseRefreshTokenData } from '~/lib/request-parsing'
import { StandardResponse } from '~/lib/responses'
import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import {
	createForbiddenErrorSchema,
	forbiddenResponse,
	internalServerErrorResponse,
	InternalServerErrorSchema,
} from '~/lib/openapi/errors'
import { UserSchema } from '~/lib/openapi/schemas/user'

const errorMessages = {
	tokenRequired: 'You must specify a token to refresh',
	refreshTokenInvalid:
		'Refresh token invalid or too old. Please sign in with your username and password.',
}

const RefreshAuthRequestSchema = z
	.object({
		token: z
			.string()
			.trim()
			.min(1, {
				error: errorMessages.tokenRequired,
			})
			.meta({
				description:
					'Refresh token bound to the current access token. This value is compared to the hash of the supplied bearer token.',
				example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
			}),
	})
	.meta({
		id: 'RefreshAuthRequest',
		description:
			'Refresh authentication request body. Can be submitted as JSON or form data.',
	})

const JwtTokenSchema = z.jwt({ alg: 'HS256' }).meta({
	description: 'JWT access token',
	example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
})

const RefreshAuthResponseSchema = z
	.object({
		code: z.literal('Authorized').default('Authorized'),
		message: z
			.literal('Successfully refreshed auth')
			.default('Successfully refreshed auth'),
		data: z.object({
			user: UserSchema,
		}),
		token: JwtTokenSchema.meta({
			description: 'New JWT access token',
		}),
		refreshToken: z.string().meta({
			description: 'New refresh token',
			example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
		}),
	})
	.meta({
		id: 'RefreshAuthResponse',
		description: 'Successfully refreshed authentication response.',
	})

const RefreshAuthForbiddenErrorSchema = createForbiddenErrorSchema({
	id: 'RefreshAuthForbiddenError',
	description:
		'Authentication failed because the refresh token is missing, invalid, expired, or the request body could not be parsed.',
	messageSchema: z.union([
		z.literal(errorMessages.tokenRequired),
		z.literal(errorMessages.refreshTokenInvalid),
		z.string().startsWith('Invalid request format:').meta({
			example:
				'Invalid request format: Failed to parse request body as JSON or form data',
		}),
	]),
})

export const openapi: ZodOpenApiPathItemObject = {
	post: {
		tags: ['Authentication'],
		summary: 'Refresh authentication token',
		description:
			'Refreshes the JWT access token using a valid refresh token. The current access token must be supplied via the Authorization bearer header, and the refresh token must be supplied in the request body.',
		operationId: 'refreshAuth',
		security: [{ bearerAuth: [] }],

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: RefreshAuthRequestSchema,
				},
				'application/x-www-form-urlencoded': {
					schema: RefreshAuthRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description: 'Successfully refreshed authentication.',
				content: {
					'application/json': {
						schema: RefreshAuthResponseSchema,
					},
				},
			},

			403: forbiddenResponse(
				RefreshAuthForbiddenErrorSchema,
				'Authentication failed. The refresh token is missing, invalid, expired, or the request body could not be parsed.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

export const action = async ({ request }: Route.ActionArgs) => {
	try {
		// Parse request data - handles both JSON and form data automatically
		const data = await parseRefreshTokenData(request)

		if (!data.token || data.token.trim().length === 0)
			return StandardResponse.forbidden('You must specify a token to refresh')

		// We deliberately make casts and stuff like that, so everything
		// but the happy path will result in an internal server error.
		// This is done s.t. we are not leaking information if someone
		// tries sending random token to see if users exist or similar
		const user = (await getUserFromJwt(request)) as User
		const rawAuthorizationHeader = request.headers
			.get('authorization')!
			.toString()
		const [, jwtString = ''] = rawAuthorizationHeader.split(' ')

		if (data.token !== hashJwt(jwtString))
			return StandardResponse.forbidden(
				'Refresh token invalid or too old. Please sign in with your username and password.',
			)

		const { token, refreshToken } = (await refreshJwt(user, data.token)) || {}

		if (token && refreshToken)
			return StandardResponse.ok({
				code: 'Authorized',
				message: 'Successfully refreshed auth',
				data: { user },
				token,
				refreshToken,
			})
		else
			return StandardResponse.forbidden(
				'Refresh token invalid or too old. Please sign in with your username and password.',
			)
	} catch (error) {
		// Handle parsing errors
		if (error instanceof Error && error.message.includes('Failed to parse'))
			return StandardResponse.forbidden(
				`Invalid request format: ${error.message}`,
			)

		// Handle other errors
		console.warn(error)
		return StandardResponse.internalServerError()
	}
}
