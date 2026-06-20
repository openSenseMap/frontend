import { type ChartData } from 'chart.js'
import { type GraphPoint, type GraphSensor } from './graph-chart-data'

function csvValue(value: unknown) {
	if (value === null || value === undefined) return ''

	const stringValue = String(value)

	if (!/[",\n\r]/.test(stringValue)) return stringValue

	return `"${stringValue.replace(/"/g, '""')}"`
}

export function buildChartCsv(
	chartData: ChartData<'scatter', GraphPoint[]>,
	sensors: GraphSensor[],
) {
	const labels = chartData.datasets[0]?.data.map((point) => point.x) ?? []
	let csvContent = 'timestamp,deviceId,sensorId,value,unit,phenomena\n'

	labels.forEach((timestamp, index) => {
		sensors.forEach((sensor) => {
			const dataset = chartData.datasets.find(
				(dataset) => dataset.label === sensor.title,
			)

			if (!dataset) return

			const value = dataset.data[index]?.y ?? ''

			csvContent += [
				timestamp,
				sensor.deviceId,
				sensor.id,
				value,
				sensor.unit,
				sensor.title,
			]
				.map(csvValue)
				.join(',')
			csvContent += '\n'
		})
	})

	return csvContent
}
