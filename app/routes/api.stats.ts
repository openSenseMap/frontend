import { type LoaderFunctionArgs } from 'react-router'
import { getStatistics } from '~/lib/statistics-service.server'
import { StandardResponse } from '~/utils/response-utils'

export async function loader({ request }: LoaderFunctionArgs) {
	try {
		const url = new URL(request.url)
		const humanParam = url.searchParams.get('human')

		let humanReadable = false
		if (
			humanParam !== null &&
			humanParam.toLowerCase() !== 'true' &&
			humanParam.toLowerCase() !== 'false'
		)
			return StandardResponse.badRequest(
				'Illegal value for parameter human. allowed values: true, false',
			)

		humanReadable = humanParam?.toLowerCase() === 'true' || false

		const stats = await getStatistics(humanReadable)
		return StandardResponse.ok(stats)
	} catch (e) {
		console.warn(e)
		return StandardResponse.internalServerError()
	}
}
