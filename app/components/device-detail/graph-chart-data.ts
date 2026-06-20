import { type ChartData } from 'chart.js'

export type GraphMeasurement = {
	time: Date | string | null
	value: number | null
	min_value?: number | null
	max_value?: number | null
	locationId?: number | null
}

export type GraphSensor = {
	id: string
	deviceId: string
	title: string
	unit: string | null
	device_name?: string | null
	data: GraphMeasurement[]
	color: string
}

export type GraphPoint = {
	x: Date | string | null
	y: number | null
	locationId: number | null
}

type BuildChartDataArgs = {
	sensors: GraphSensor[]
	isAggregated: boolean
	pointRadius?: number
}

export function buildChartData({
	sensors,
	isAggregated,
	pointRadius = 1,
}: BuildChartDataArgs): ChartData<'scatter', GraphPoint[]> {
	const includeDeviceName =
		sensors.length === 2 && sensors[0].device_name !== sensors[1].device_name

	return {
		datasets: sensors.flatMap((sensor, index) => {
			const label = includeDeviceName
				? `${sensor.title} (${sensor.device_name})`
				: sensor.title

			const baseDataset = {
				label,
				data: sensor.data.map((measurement) => ({
					x: measurement.time,
					y: measurement.value,
					locationId: measurement.locationId ?? null,
				})),
				pointRadius,
				borderColor: sensor.color,
				backgroundColor: sensor.color,
				yAxisID: index === 0 ? 'y' : 'y1',
				fill: false,
				tension: 0.4,
			}

			if (isAggregated && sensors.length === 1) {
				const minDataset = {
					...baseDataset,
					label: `${baseDataset.label} (Min)`,
					data: sensor.data.map((measurement) => ({
						x: measurement.time,
						y: measurement.min_value ?? null,
						locationId: null,
					})),
					borderColor: sensor.color + '33',
					backgroundColor: sensor.color + '33',
					fill: 1,
				}

				const maxDataset = {
					...baseDataset,
					label: `${baseDataset.label} (Max)`,
					data: sensor.data.map((measurement) => ({
						x: measurement.time,
						y: measurement.max_value ?? null,
						locationId: null,
					})),
					borderColor: sensor.color + '33',
					backgroundColor: sensor.color + '33',
					fill: 1,
				}

				return [maxDataset, baseDataset, minDataset]
			}

			return [baseDataset]
		}),
	}
}
