import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import { getUserDeviceIds } from '~/db/models/device.server'
import { type User } from '~/db/schema/user'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'
import { deleteUser, updateUserDetails } from '~/services/user-service.server'
import { type Route } from './+types/api.users.me'
import {
	UserLanguageSchema,
	UserSchema,
	UserWithBoxesSchema,
} from '~/lib/openapi/schemas/user'
import {
	BadRequestErrorSchema,
	badRequestResponse,
	ForbiddenErrorSchema,
	forbiddenResponse,
	internalServerErrorResponse,
	InternalServerErrorSchema,
	MethodNotAllowedErrorSchema,
	methodNotAllowedResponse,
	UnauthorizedErrorSchema,
	unauthorizedResponse,
} from '~/lib/openapi/errors'
import { apiMessages } from '~/lib/openapi/messages'

const messages = {
	noChanges: 'No changed properties supplied. User remains unchanged.',
	badRequest: 'Bad Request',
	currentPasswordRequired:
		'Current password is required when setting a new password',
	passwordIncorrect: 'Password incorrect',
} as const

const GetMeResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		data: z.object({
			me: UserWithBoxesSchema,
		}),
	})
	.meta({
		id: 'GetCurrentUserResponse',
		description: 'Current authenticated user including device ids.',
	})

const UpdateCurrentUserRequestSchema = z
	.object({
		email: z.string().trim().email().optional().meta({
			description: 'New email address',
			example: 'newemail@example.com',
		}),
		language: UserLanguageSchema.optional(),
		name: z.string().trim().min(1).optional().meta({
			description: "User's display name",
			example: 'John Doe',
		}),
		currentPassword: z.string().min(1).optional().meta({
			description: 'Current password, required when setting a new password',
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
	.meta({
		id: 'UpdateCurrentUserRequest',
		description: 'Payload for updating the authenticated user profile.',
	})

const UpdateCurrentUserSuccessResponseSchema = z
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
		description: 'Profile updated successfully.',
	})

const UpdateCurrentUserNoChangesResponseSchema = z
	.object({
		code: z.literal('Ok').default('Ok'),
		message: z.literal(messages.noChanges).default(messages.noChanges),
	})
	.meta({
		id: 'UpdateCurrentUserNoChangesResponse',
		description: 'No profile changes were applied.',
	})

const UpdateCurrentUserResponseSchema = z
	.union([
		UpdateCurrentUserSuccessResponseSchema,
		UpdateCurrentUserNoChangesResponseSchema,
	])
	.meta({
		id: 'UpdateCurrentUserResponse',
		description:
			'Response returned after updating the current user. If no changed properties are supplied, a no-changes response is returned.',
	})

const DeleteCurrentUserRequestSchema = z
	.object({
		password: z.string().min(1, messages.badRequest).meta({
			description: 'Current password for account deletion confirmation',
			example: 'myCurrentPassword123',
			format: 'password',
		}),
	})
	.meta({
		id: 'DeleteCurrentUserRequest',
		description: 'Payload for deleting the authenticated user account.',
	})

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['User Management'],
		summary: 'Get current user profile',
		description:
			"Retrieves the authenticated user's profile information, including the ids of the user's devices.",
		operationId: 'getCurrentUser',
		security: [{ bearerAuth: [] }],

		responses: {
			200: {
				description: 'Successfully retrieved user profile.',
				content: {
					'application/json': {
						schema: GetMeResponseSchema,
					},
				},
			},

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid or missing JWT authorization.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},

	put: {
		tags: ['User Management'],
		summary: 'Update current user profile',
		description:
			"Updates the authenticated user's profile information. To change the password, `currentPassword` must be supplied together with `newPassword`.",
		operationId: 'updateCurrentUser',
		security: [{ bearerAuth: [] }],

		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: UpdateCurrentUserRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description:
					'User profile updated successfully, or no changed properties were supplied.',
				content: {
					'application/json': {
						schema: UpdateCurrentUserResponseSchema,
					},
				},
			},

			400: badRequestResponse(
				BadRequestErrorSchema,
				'Bad request. This can happen for invalid JSON, invalid request data, missing current password for password changes, or rejected update data.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid or missing JWT authorization.',
			),

			405: methodNotAllowedResponse(
				MethodNotAllowedErrorSchema,
				'Method not allowed.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},

	delete: {
		tags: ['User Management'],
		summary: 'Delete current user account',
		description:
			"Permanently deletes the authenticated user's account. The current password must be supplied as form data.",
		operationId: 'deleteCurrentUser',
		security: [{ bearerAuth: [] }],

		requestBody: {
			required: true,
			content: {
				'application/x-www-form-urlencoded': {
					schema: DeleteCurrentUserRequestSchema,
				},
			},
		},

		responses: {
			200: {
				description: 'Account successfully deleted.',
				content: {
					'application/json': {
						schema: z.null().meta({
							description:
								'JSON null response indicating successful account deletion.',
						}),
					},
				},
			},

			400: badRequestResponse(
				BadRequestErrorSchema,
				'Bad request. This can happen when the form body cannot be parsed or the password is missing.',
			),

			401: unauthorizedResponse(
				UnauthorizedErrorSchema,
				'Unauthorized. The provided password is incorrect.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid or missing JWT authorization.',
			),

			405: methodNotAllowedResponse(
				MethodNotAllowedErrorSchema,
				'Method not allowed.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
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
			return StandardResponse.forbidden(apiMessages.invalidJwt)
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

		const requestParsed =
			await UpdateCurrentUserRequestSchema.safeParseAsync(body)

		if (!requestParsed.success) {
			return StandardResponse.badRequest(
				requestParsed.error.issues[0]?.message ?? messages.badRequest,
			)
		}

		const jwtString = getBearerToken(request)

		if (!jwtString) {
			return StandardResponse.forbidden(apiMessages.invalidJwt)
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

			const responseParsed =
				await UpdateCurrentUserNoChangesResponseSchema.safeParseAsync({
					code: 'Ok',
					message: messages.noChanges,
				})

			if (!responseParsed.success) {
				console.warn(responseParsed.error)
				return StandardResponse.internalServerError()
			}

			return StandardResponse.ok(responseParsed.data)
		}

		const responseParsed =
			await UpdateCurrentUserSuccessResponseSchema.safeParseAsync({
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

		const requestParsed = DeleteCurrentUserRequestSchema.safeParse(
			Object.fromEntries(formData.entries()),
		)

		if (!requestParsed.success) {
			return StandardResponse.badRequest(
				requestParsed.error.issues[0]?.message ?? messages.badRequest,
			)
		}

		const jwtString = getBearerToken(request)

		if (!jwtString) {
			return StandardResponse.forbidden(apiMessages.invalidJwt)
		}

		const deleted = await deleteUser(
			user,
			requestParsed.data.password,
			jwtString,
		)

		if (deleted === 'unauthorized') {
			return StandardResponse.unauthorized(apiMessages.passwordIncorrect)
		}

		return StandardResponse.ok(null)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
