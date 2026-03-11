import { type ActionFunction, type ActionFunctionArgs } from 'react-router'
import { requestPasswordReset } from '~/lib/user-service.server'
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
		!formData.has('email') ||
		formData.get('email')?.toString().trim().length === 0
	)
		return StandardResponse.badRequest('No email address specified.')

	try {
		await requestPasswordReset(formData.get('email')!.toString())

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
