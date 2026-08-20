import { data } from 'react-router'
import { type Route } from './+types/resources.elevation'
import { type ElevationResourceResponse } from '~/lib/elevation'
import { locationCoordinatesSchema } from '~/lib/location'
import {
	ElevationLookupError,
	getTerrainElevation,
} from '~/services/elevation-service.server'
import { getUserId } from '~/services/session-service.server'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await getUserId(request)
	if (!userId) throw new Response('Unauthorized', { status: 401 })

	const url = new URL(request.url)
	const parsed = locationCoordinatesSchema.safeParse({
		latitude: url.searchParams.get('latitude'),
		longitude: url.searchParams.get('longitude'),
	})

	if (!parsed.success) {
		return data<ElevationResourceResponse>(
			{ ok: false, error: 'invalid_location' },
			{ status: 400 },
		)
	}

	try {
		const result = await getTerrainElevation(
			parsed.data.latitude,
			parsed.data.longitude,
		)

		return data<ElevationResourceResponse>(
			{ ok: true, result },
			{
				headers: {
					'Cache-Control': 'private, max-age=300',
				},
			},
		)
	} catch (error) {
		const code =
			error instanceof ElevationLookupError ? error.code : 'upstream_error'

		return data<ElevationResourceResponse>(
			{ ok: false, error: code },
			{ status: code === 'unavailable' ? 404 : 503 },
		)
	}
}
