import { type ActionFunction, type ActionFunctionArgs } from 'react-router'
import { createToken } from '~/lib/jwt'
import { parseUserRegistrationData } from '~/lib/request-parsing'
import { registerUser } from '~/lib/user-service.server'
import { StandardResponse } from '~/utils/response-utils'

function mapRegistrationError(code: string): string {
	switch (code) {
		case 'username_required':
			return 'Username is required.'
		case 'username_length':
			return 'Username must be at least 3 characters long and not more than 40.'
		case 'username_invalid':
			return 'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.'
		case 'username_already_taken':
			return 'Username is already taken.'
		case 'email_required':
			return 'Email is required.'
		case 'email_invalid':
			return 'Invalid email format.'
		case 'email_already_taken':
			return 'User already exists.'
		case 'password_required':
			return 'Password is required.'
		case 'password_too_short':
			return 'Password must be at least 8 characters long.'
		case 'registration_failed':
		default:
			return 'Bad Request'
	}
}

export const action: ActionFunction = async ({
	request,
}: ActionFunctionArgs) => {
	if (request.method !== 'POST') {
		return StandardResponse.methodNotAllowed('')
	}

	try {
		const data = await parseUserRegistrationData(request)

		const username = data.name
		const email = data.email
		const password = data.password
		const language = data.language as 'de_DE' | 'en_US'

		const registration = await registerUser(username, email, password, language)

		if (!registration.ok) {
			return StandardResponse.badRequest(
				mapRegistrationError(registration.code),
			)
		}

		const user = registration.user

		try {
			const { token, refreshToken } = await createToken(user)

			return StandardResponse.created({
				message: 'Successfully registered new user',
				token,
				refreshToken,
				data: user,
			})
		} catch (err) {
			console.error('Unable to create JWT', err)
			return StandardResponse.internalServerError(
				`Unable to create jwt for newly created user: ${(err as Error)?.message}`,
			)
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes('Failed to parse')) {
			return StandardResponse.badRequest(
				`Invalid request format: ${error.message}`,
			)
		}

		console.error('Registration error:', error)
		return StandardResponse.internalServerError()
	}
}