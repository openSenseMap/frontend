import { type ActionFunction, type ActionFunctionArgs } from 'react-router'
import { confirmEmail } from '~/lib/user-service.server'
import { StandardResponse } from '~/utils/response-utils'

export const action: ActionFunction = async ({
	request,
}: ActionFunctionArgs) => {
	let formData = new FormData()
	try {
		formData = await request.formData()
	} catch {
		// Just continue, it will fail in the next check
		// The try catch block handles an exception that occurs if the
		// request was sent without x-www-form-urlencoded content-type header
	}

	if (
		!formData.has('token') ||
		formData.get('token')?.toString().trim().length === 0
	)
  return StandardResponse.badRequest('No email confirmation token specified.');

	if (
		!formData.has('email') ||
		formData.get('email')?.toString().trim().length === 0
	)
  return StandardResponse.badRequest('No email address to confirm specified.');

	try {
		const updatedUser = await confirmEmail(
			formData.get('token')!.toString(),
			formData.get('email')!.toString(),
		)

		if (updatedUser === null)
      return StandardResponse.forbidden('Invalid or expired confirmation token.');

    return StandardResponse.ok({
				code: 'Ok',
				message: 'E-Mail successfully confirmed. Thank you',
			});
	} catch (err) {
		console.warn(err)
    return StandardResponse.internalServerError();
	}
}
