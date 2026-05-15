import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import { getUserDeviceIds } from '~/db/models/device.server'
import { type User } from '~/db/schema/user'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'
import { deleteUser, updateUserDetails } from '~/services/user-service.server'
import { type Route } from './+types/api.users.me'

const messages = {
	invalidJwt: 'Invalid JWT authorization. Please sign in to obtain new JWT.',
	internal:
		'The server was unable to complete your request. Please try again later.',
	noChanges: 'No changed properties supplied. User remains unchanged.',
	badRequest: 'Bad Request',
	passwordIncorrect: 'Password incorrect',
	currentPasswordRequired:
		'Current password is required when setting a new password',
}

/**
 * During migration I would keep this loose, because jwtResponse / updatedUser
 * may contain additional fields that your service layer still needs.
 *
 * Once you know the exact public response shape, you can switch this to
 * z.object(...) for stricter output.
 */
const UserSchema = z
	.looseObject({
		id: z.string().meta({
			description: 'Unique user identifier',
			example: 'user_123456',
		}),
		email: z.string().email().meta({
			description: "User's email address",
			example: 'user@example.com',
		}),
		name: z.string().meta({
			description: "User's display name",
			example: 'John Doe',
		}),
		language: z.string().meta({
			description: "User's preferred language",
			example: 'en',
		}),
		role: z.string().optional().meta({
			description: "User's role",
			example: 'user',
		}),
		emailIsConfirmed: z.boolean().optional().meta({
			description: "Whether the user's email address is confirmed",
			example: true,
		}),
		createdAt: z.string().datetime().optional().meta({
			description: 'Account creation timestamp',
			example: '2024-01-15T10:30:00Z',
		}),
		updatedAt: z.string().datetime().optional().meta({
			description: 'Last account update timestamp',
			example: '2024-01-20T14:45:00Z',
		}),
	})
	.meta({
		id: 'User',
		description: 'User profile information',
	})

const UserWithBoxesSchema = UserSchema.extend({
	boxes: z.array(z.string()).meta({
		description: 'A list of ids of the users devices',
		example: ['60a13611a877b3001b8ffd59', '5bdbe70f55d0ad001a04edc9'],
	}),
}).meta({
	id: 'UserWithBoxes',
	description: 'User profile information including device ids',
})

const GetMeResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		data: z.object({
			me: UserWithBoxesSchema,
		}),
	})
	.meta({ id: 'GetCurrentUserResponse' })

const PutRequestSchema = z
	.object({
		email: z.string().trim().email().optional().meta({
			description: 'New email address',
			example: 'newemail@example.com',
		}),
		language: z.string().trim().min(1).optional().meta({
			description: 'Preferred language setting',
			example: 'en',
		}),
		name: z.string().trim().min(1).optional().meta({
			description: "User's display name",
			example: 'John Doe',
		}),
		currentPassword: z.string().min(1).optional().meta({
			description: 'Current password, required for password changes',
			example: 'currentPassword123',
			format: 'password',
		}),
		newPassword: z.string().min(8).optional().meta({
			description: 'New password',
			example: 'newPassword456',
			format: 'password',
		}),
	})
	.superRefine((data, ctx) => {
		if (data.newPassword && !data.currentPassword) {
			ctx.addIssue({
				code: 'custom',
				path: ['currentPassword'],
				message: messages.currentPasswordRequired,
			})
		}
	})
	.meta({ id: 'UpdateCurrentUserRequest' })

const PutUpdatedResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		message: z.string().meta({
			example: 'User successfully saved. Password updated.',
		}),
		data: z.object({
			me: UserSchema,
		}),
	})
	.meta({
		id: 'UpdateCurrentUserSuccessResponse',
		description: 'Profile updated successfully',
	})

const PutNoChangesResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		message: z.literal(messages.noChanges).default(messages.noChanges),
	})
	.meta({
		id: 'UpdateCurrentUserNoChangesResponse',
		description: 'No changes made',
	})

const PutResponseSchema = z.union([
	PutUpdatedResponseSchema,
	PutNoChangesResponseSchema,
])

const DeleteRequestSchema = z
	.object({
		password: z.string().min(1, messages.badRequest).meta({
			description: 'Current password for account deletion confirmation',
			example: 'myCurrentPassword123',
			format: 'password',
		}),
	})
	.meta({ id: 'DeleteCurrentUserRequest' })

const ForbiddenErrorSchema = z
	.object({
		code: z.literal('Forbidden').default('Forbidden'),
		message: z.literal(messages.invalidJwt).default(messages.invalidJwt),
		error: z.literal(messages.invalidJwt).optional(),
	})
	.meta({ id: 'ForbiddenError' })

const BadRequestErrorSchema = z
	.object({
		code: z.literal('Bad Request').default('Bad Request'),
		message: z.string().meta({
			example: 'Current password is incorrect',
		}),
		error: z.string().optional(),
	})
	.meta({ id: 'BadRequestError' })

const UnauthorizedErrorSchema = z
	.object({
		code: z.literal('Unauthorized').default('Unauthorized'),
		message: z.literal(messages.passwordIncorrect),
		error: z.literal(messages.passwordIncorrect).optional(),
	})
	.meta({ id: 'UnauthorizedError' })

const InternalServerErrorSchema = z
	.object({
		code: z.literal('Internal Server Error').default('Internal Server Error'),
		message: z.literal(messages.internal).default(messages.internal),
		error: z.literal(messages.internal).optional(),
	})
	.meta({ id: 'InternalServerError' })

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['User Management'],
		summary: 'Get current user profile',
		description: "Retrieves the authenticated user's profile information",
		operationId: 'getCurrentUser',
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: 'Successfully retrieved user profile',
				content: {
					'application/json': { schema: GetMeResponseSchema },
				},
			},
			403: {
				description: 'Invalid or missing JWT token',
				content: {
					'application/json': { schema: ForbiddenErrorSchema },
				},
			},
			500: {
				description: 'Internal server error',
				content: {
					'application/json': { schema: InternalServerErrorSchema },
				},
			},
		},
	},

	put: {
		tags: ['User Management'],
		summary: 'Update user profile',
		description: "Updates the authenticated user's profile information",
		operationId: 'updateUserProfile',
		security: [{ bearerAuth: [] }],
		requestBody: {
			required: true,
			content: {
				'application/json': { schema: PutRequestSchema },
			},
		},
		responses: {
			200: {
				description: 'User profile updated successfully or no changes made',
				content: {
					'application/json': { schema: PutResponseSchema },
				},
			},
			400: {
				description: 'Bad request - validation errors',
				content: {
					'application/json': { schema: BadRequestErrorSchema },
				},
			},
			403: {
				description: 'Invalid or missing JWT token',
				content: {
					'application/json': { schema: ForbiddenErrorSchema },
				},
			},
			500: {
				description: 'Internal server error',
				content: {
					'application/json': { schema: InternalServerErrorSchema },
				},
			},
		},
	},

	delete: {
		tags: ['User Management'],
		summary: 'Delete user account',
		description: "Permanently deletes the authenticated user's account",
		operationId: 'deleteUserAccount',
		security: [{ bearerAuth: [] }],
		requestBody: {
			required: true,
			content: {
				'application/x-www-form-urlencoded': {
					schema: DeleteRequestSchema,
				},
			},
		},
		responses: {
			200: {
				description: 'Account successfully deleted',
				content: {
					'application/json': {
						schema: z.null().meta({
							description: 'Empty response indicating successful deletion',
						}),
					},
				},
			},
			400: {
				description: 'Bad request - missing password',
				content: {
					'application/json': { schema: BadRequestErrorSchema },
				},
			},
			401: {
				description: 'Unauthorized - incorrect password',
				content: {
					'application/json': { schema: UnauthorizedErrorSchema },
				},
			},
			403: {
				description: 'Invalid or missing JWT token',
				content: {
					'application/json': { schema: ForbiddenErrorSchema },
				},
			},
			500: {
				description: 'Internal server error',
				content: {
					'application/json': { schema: InternalServerErrorSchema },
				},
			},
		},
	},
}

const getBearerToken = (request: Request) => {
	const rawAuthorizationHeader = request.headers.get('authorization')
	if (!rawAuthorizationHeader) return undefined

	const [scheme, token] = rawAuthorizationHeader.split(' ')
	if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined

	return token
}

export const loader = async ({ request }: Route.LoaderArgs) => {
	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string') {
			return StandardResponse.forbidden(messages.invalidJwt)
		}

		const deviceIds = await getUserDeviceIds(jwtResponse.id)

		const responseParsed = await GetMeResponseSchema.safeParseAsync({
			code: 'Ok',
			data: { me: { ...jwtResponse, boxes: deviceIds } },
		})

		if (!responseParsed.success) {
			console.warn(responseParsed.error)
			return StandardResponse.internalServerError()
		}

		return StandardResponse.ok(responseParsed.data)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}

export const action = async ({ request }: Route.ActionArgs) => {
	const loaderValue = (await loader({
		request,
	} as Route.LoaderArgs)) as Response

	if (loaderValue.status !== 200) return loaderValue

	const user = (await loaderValue.json()).data.me as User

	switch (request.method) {
		case 'PUT':
			return await put(user, request)
		case 'DELETE':
			return await del(user, request)
		default:
			return StandardResponse.methodNotAllowed('Method Not Allowed')
	}
}

const put = async (user: User, request: Request): Promise<Response> => {
	try {
		let body: unknown

		try {
			body = await request.json()
		} catch {
			return StandardResponse.badRequest(messages.badRequest)
		}

		const requestParsed = await PutRequestSchema.safeParseAsync(body)

		if (!requestParsed.success) {
			return StandardResponse.badRequest(
				requestParsed.error.issues[0]?.message ?? messages.badRequest,
			)
		}

		const jwtString = getBearerToken(request)

		if (!jwtString) {
			return StandardResponse.forbidden(messages.invalidJwt)
		}

		const {
			updated,
			messages: updateMessages,
			updatedUser,
		} = await updateUserDetails(user, jwtString, requestParsed.data)

		const messageText = updateMessages.join('.')

		if (updated === false) {
			if (updateMessages.length > 0) {
				return StandardResponse.badRequest(messageText)
			}

			const responseParsed = await PutNoChangesResponseSchema.safeParseAsync({
				code: 'Ok',
				message: messages.noChanges,
			})

			if (!responseParsed.success) {
				console.warn(responseParsed.error)
				return StandardResponse.internalServerError()
			}

			return StandardResponse.ok(responseParsed.data)
		}

		const responseParsed = await PutUpdatedResponseSchema.safeParseAsync({
			code: 'Ok',
			message: `User successfully saved. ${messageText}`,
			data: { me: updatedUser },
		})

		if (!responseParsed.success) {
			console.warn(responseParsed.error)
			return StandardResponse.internalServerError()
		}

		return StandardResponse.ok(responseParsed.data)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}

const del = async (user: User, request: Request): Promise<Response> => {
	try {
		let formData: FormData

		try {
			formData = await request.formData()
		} catch {
			return StandardResponse.badRequest(messages.badRequest)
		}

		const requestParsed = DeleteRequestSchema.safeParse(
			Object.fromEntries(formData.entries()),
		)

		if (!requestParsed.success) {
			return StandardResponse.badRequest(
				requestParsed.error.issues[0]?.message ?? messages.badRequest,
			)
		}

		const jwtString = getBearerToken(request)

		if (!jwtString) {
			return StandardResponse.forbidden(messages.invalidJwt)
		}

		const deleted = await deleteUser(
			user,
			requestParsed.data.password,
			jwtString,
		)

		if (deleted === 'unauthorized') {
			return StandardResponse.unauthorized(messages.passwordIncorrect)
		}

		return StandardResponse.ok(null)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
