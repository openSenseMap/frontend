import { type Route } from './+types/api.tags'
import { getTags } from '~/services/device-service.server'
import { StandardResponse } from '~/lib/responses'

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
