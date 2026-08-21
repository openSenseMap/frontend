import type { ChartData, ChartDataset, Point } from 'chart.js'

export interface MeasurementChartPoint extends Point {
	x: number
	timestamp: number
	y: number
	locationId: number | null
}

interface MeasurementChartMeasurement {
	time: Date | string | number
	value: unknown
	min_value?: unknown
	max_value?: unknown
	locationId?: number | null
}

export interface MeasurementChartSensor {
	title: string
	device_name?: string | null
	data: MeasurementChartMeasurement[]
	color: string
}

export type MeasurementChartDataset = ChartDataset<
	'line',
	MeasurementChartPoint[]
> & {
	label: string
	data: MeasurementChartPoint[]
	pointRadius: number
	showLine: false
	borderColor: string
	backgroundColor: string
	yAxisID: string
	fill: boolean | number
}

export interface MeasurementChartData extends ChartData<
	'line',
	MeasurementChartPoint[]
> {
	datasets: MeasurementChartDataset[]
}

function toTimestamp(time: Date | string | number) {
	const timestamp =
		time instanceof Date ? time.getTime() : new Date(time).getTime()

	return Number.isFinite(timestamp) ? timestamp : null
}

function toNumericValue(value: unknown) {
	if (value === null || value === undefined || value === '') return null

	const numericValue = Number(value)

	return Number.isFinite(numericValue) ? numericValue : null
}

function createPoints(
	measurements: MeasurementChartMeasurement[],
	valueKey: 'value' | 'min_value' | 'max_value',
	includeLocation: boolean,
) {
	return measurements
		.map((measurement): MeasurementChartPoint | null => {
			const timestamp = toTimestamp(measurement.time)
			const value = toNumericValue(measurement[valueKey])

			if (timestamp === null || value === null) return null

			return {
				x: timestamp,
				timestamp,
				y: value,
				locationId: includeLocation ? (measurement.locationId ?? null) : null,
			}
		})
		.filter((point): point is MeasurementChartPoint => point !== null)
		.sort((left, right) => left.x - right.x)
}

export function createMeasurementChartData(
	sensors: MeasurementChartSensor[],
	isAggregated: boolean,
): MeasurementChartData {
	const includeDeviceName =
		sensors.length === 2 && sensors[0].device_name !== sensors[1].device_name

	return {
		datasets: sensors.flatMap((sensor, index) => {
			const label = includeDeviceName
				? `${sensor.title} (${sensor.device_name})`
				: sensor.title
			const baseDataset: MeasurementChartDataset = {
				label,
				data: createPoints(sensor.data, 'value', true),
				pointRadius: 1,
				showLine: false,
				borderColor: sensor.color,
				backgroundColor: sensor.color,
				yAxisID: index === 0 ? 'y' : 'y1',
				fill: false,
			}

			if (!isAggregated || sensors.length !== 1) return [baseDataset]

			const minDataset: MeasurementChartDataset = {
				...baseDataset,
				label: `${label} (Min)`,
				data: createPoints(sensor.data, 'min_value', false),
				borderColor: sensor.color + '33',
				backgroundColor: sensor.color + '33',
				fill: 1,
			}
			const maxDataset: MeasurementChartDataset = {
				...baseDataset,
				label: `${label} (Max)`,
				data: createPoints(sensor.data, 'max_value', false),
				borderColor: sensor.color + '33',
				backgroundColor: sensor.color + '33',
				fill: 1,
			}

			return [maxDataset, baseDataset, minDataset]
		}),
	}
}
