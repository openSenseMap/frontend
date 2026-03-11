import { type LoaderFunctionArgs } from 'react-router'
import { getTags } from '~/lib/device-service.server'
import { StandardResponse } from '~/utils/response-utils'

export async function loader({}: LoaderFunctionArgs) {
	try {
		const tags = await getTags()
		return StandardResponse.ok({
			code: 'Ok',
			data: tags,
		})
	} catch (e) {
		console.warn(e)
		return StandardResponse.internalServerError()
	}
}
