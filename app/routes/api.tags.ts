import { type Route } from './+types/api.tags'
import { StandardResponse } from '~/lib/responses'
import { getTags } from '~/services/device-service.server'

export async function loader({}: Route.LoaderArgs) {
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
