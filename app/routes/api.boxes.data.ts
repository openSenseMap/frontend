import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router'
import { parseBoxesDataQuery } from '~/lib/api-schemas/boxes-data-query-schema'
import { transformMeasurement } from '~/lib/measurement-service.server'
import { streamMeasurements } from '~/models/measurement.stream.server'
import { findMatchingSensors } from '~/models/sensor.server'
import { escapeCSVValue } from '~/utils/csv'
import { StandardResponse } from '~/utils/response-utils'

function createDownloadFilename(
	date: Date,
	action: string,
	params: string[],
	format: string,
) {
	return `opensensemap_org-${action}-${encodeURI(params.join('-'))}-${date
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

		const headers = new Headers()
		headers.set(
			'Content-Type',
			params.format === 'csv' ? 'text/csv' : 'application/json',
		)
		if (params.download) {
			const filename = createDownloadFilename(
				new Date(),
				'download',
				[params.phenomenon || 'data'],
				params.format,
			)
			headers.set('Content-Disposition', `attachment; filename=${filename}`)
		}

		const delimiterChar = params.delimiter === 'semicolon' ? ';' : ','

		const stream = new ReadableStream({
			async start(controller) {
				try {
					const encoder = new TextEncoder()
					let isFirst = true

					// Write CSV header or JSON opening bracket
					if (params.format === 'csv') {
						const header = params.columns.join(delimiterChar) + '\n'
						controller.enqueue(encoder.encode(header))
					} else {
						controller.enqueue(encoder.encode('['))
					}

					for await (const batch of streamMeasurements(
						sensorIds,
						params.fromDate,
						params.toDate,
						params.bbox,
					)) {
						for (const measurement of batch) {
							const transformed = transformMeasurement(
								{
									sensorId: measurement.sensor_id,
									createdAt: measurement.time
										? new Date(measurement.time)
										: null,
									value: measurement.value,
									locationId: measurement.location_id ?? null,
								},
								sensorsMap,
								{},
								params.columns,
							)

							let line: string
							if (params.format === 'csv') {
								line =
									params.columns
										.map((col: string) =>
											escapeCSVValue(
												(transformed as Record<string, any>)[col],
												delimiterChar,
											),
										)
										.join(delimiterChar) + '\n'
							} else {
								// Format as JSON
								if (!isFirst) {
									line = ',' + JSON.stringify(transformed)
								} else {
									line = JSON.stringify(transformed)
									isFirst = false
								}
							}

							controller.enqueue(encoder.encode(line))
						}
					}

					// Close JSON array
					if (params.format === 'json') {
						controller.enqueue(encoder.encode(']'))
					}

					controller.close()
				} catch (error) {
					console.error('Stream error:', error)
					controller.error(error)
				}
			},
		})

		return new Response(stream, { headers })
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
