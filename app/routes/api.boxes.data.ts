import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router'
import { parseBoxesDataQuery } from '~/lib/api-schemas/boxes-data-query-schema'
import { transformMeasurement } from '~/lib/measurement-service.server'
import { queryMeasurements } from '~/models/measurement.query.server'
import { findMatchingSensors } from '~/models/sensor.server'
import { formatAsCSV } from '~/utils/csv'
import { StandardResponse } from '~/utils/response-utils'

function createDownloadFilename(
	date: Date,
	action: string,
	params: string[],
	format: string,
) {
	return `opensensemap_org-${action}-${encodeURI(
		encodeURI(params.join('-')),
	)}-${date
		.toISOString()
		.replace(/-|:|\.\d*Z/g, '')
		.replace('T', '_')}.${format}`
}

export async function loader({ request }: LoaderFunctionArgs) {
	try {
		const params = await parseBoxesDataQuery(request)

		const { sensorsMap, sensorIds } = await findMatchingSensors(params)

		if (sensorIds.length === 0) {
			return StandardResponse.notFound('No matching sensors found')
		}

		const { measurements, locationsMap } = await queryMeasurements(
			sensorIds,
			params.fromDate,
			params.toDate,
			params.bbox,
		)

		// Transform measurements to requested columns
		const transformedData = measurements.map((m) =>
			transformMeasurement(m, sensorsMap, locationsMap, params.columns),
		)

		let body: string
		let contentType: string

		if (params.format === 'csv') {
			body = formatAsCSV(transformedData, params.columns, params.delimiter)
			contentType = 'text/csv'
		} else {
			body = JSON.stringify(transformedData)
			contentType = 'application/json'
		}

		const headers = new Headers()
		headers.set('Content-Type', contentType)

		if (params.download) {
			const filename = createDownloadFilename(
				new Date(),
				'download',
				[params.phenomenon || 'data'],
				params.format,
			)

			headers.set('Content-Disposition', `attachment; filename=${filename}`)
		}

		return new Response(body, { headers })
	} catch (err) {
		if (err instanceof Response) throw err
		return StandardResponse.internalServerError()
	}
}

export async function action(args: ActionFunctionArgs) {
	return loader({
		request: args.request,
		params: args.params as any,
		context: args.context as any,
	})
}
