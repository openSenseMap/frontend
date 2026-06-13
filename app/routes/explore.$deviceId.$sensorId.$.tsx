import { addDays } from 'date-fns'
import { redirect, useLoaderData } from 'react-router'
import { type Route } from './+types/explore.$deviceId.$sensorId.$'
import Graph from '~/components/device-detail/graph'
import MobileBoxView from '~/components/map/layers/mobile/mobile-box-view'
import { getDevice } from '~/db/models/device.server'
import { getMeasurement } from '~/db/models/measurement.query.server'
import { getComparableSensors, getSensor } from '~/db/models/sensor.server'
import { type SensorWithMeasurementData } from '~/db/schema'
import {
	categorizeIntoTrips,
	type LocationPoint,
} from '~/lib/mobile-box-helper'

interface SensorWithColor extends SensorWithMeasurementData {
	color: string
	deviceName: string
}

const sensorColors = [
	'#8da0cb',
	'#fc8d62',
	'#66c2a5',
	'#e78ac3',
	'#a6d854',
	'#ffd92f',
	'#e5c494',
	'#b3b3b3',
]

const maxGraphSensors = 5

function normalizeMeasurementData(
	measurementData: {
		sensorId: string
		locationId: bigint | null
		time: Date
		value: number | null
		location: {
			id: bigint
			x: number
			y: number
		} | null
	}[],
) {
	return measurementData.map((d) => ({
		...d,
		locationId: d.locationId === null ? null : Number(d.locationId),
		location: d.location
			? {
					...d.location,
					id: Number(d.location.id),
				}
			: null,
	}))
}

function filterLatestTripData(
	measurementData: ReturnType<typeof normalizeMeasurementData>,
) {
	const dataPoints: LocationPoint[] = measurementData
		.filter((d) => d.location !== null)
		.map((d) => ({
			geometry: { x: d.location!.x, y: d.location!.y },
			time: d.time.toISOString(),
		}))

	const trips = categorizeIntoTrips(dataPoints, 600)
	const latestTrip = trips[0]

	if (!latestTrip) {
		return measurementData
	}

	const tripStartTime = new Date(latestTrip.startTime).getTime()
	const tripEndTime = new Date(latestTrip.endTime).getTime()

	return measurementData.filter((point) => {
		const pointTime = point.time.getTime()
		return pointTime >= tripStartTime && pointTime <= tripEndTime
	})
}

async function loadGraphSensor({
	sensorId,
	aggregation,
	startDate,
	endDate,
	color,
}: {
	sensorId: string
	aggregation: string
	startDate: string | null
	endDate: string | null
	color: string
}): Promise<SensorWithColor | null> {
	const sensor = (await getSensor(sensorId)) as SensorWithColor | null

	if (!sensor) return null

	const sensorDevice = await getDevice({ id: sensor.deviceId })
	const sensorData = await getMeasurement(
		sensorId,
		aggregation,
		startDate ? new Date(startDate) : undefined,
		endDate ? addDays(new Date(endDate), 1) : undefined,
	)
	const normalizedData = normalizeMeasurementData(sensorData as any)
	const data =
		sensorDevice?.exposure === 'mobile' && !startDate
			? filterLatestTripData(normalizedData)
			: normalizedData

	sensor.data = data.map((d) => ({
		...d,
		sensorId,
		locationId: d.locationId ?? null,
		location: d.location,
		time: d.time,
		value: d.value ?? 0,
	}))
	sensor.color = color
	sensor.deviceName = sensorDevice?.name ?? sensor.deviceId

	return sensor
}

export async function loader({ params, request }: Route.LoaderArgs) {
	const { deviceId, sensorId } = params

	if (!deviceId) {
		return redirect('/explore')
	}

	const device = await getDevice({ id: deviceId })

	if (!device) {
		return redirect('/explore')
	}

	const url = new URL(request.url)
	const aggregation = url.searchParams.get('aggregation') || 'raw'
	const startDate = url.searchParams.get('date_from')
	const endDate = url.searchParams.get('date_to')

	if (!sensorId) {
		throw new Response('Sensor 1 not found', { status: 404 })
	}

	const comparisonSensorIds = Array.from(
		new Set(
			(params['*'] ?? '')
				.split('/')
				.map((id) => id.trim())
				.filter(Boolean),
		),
	).slice(0, maxGraphSensors - 1)

	const sensors = (
		await Promise.all(
			[sensorId, ...comparisonSensorIds].map((id, index) =>
				loadGraphSensor({
					sensorId: id,
					aggregation,
					startDate,
					endDate,
					color: sensorColors[index % sensorColors.length],
				}),
			),
		)
	).filter((sensor): sensor is SensorWithColor => sensor !== null)

	const sensor1 = sensors[0]

	if (!sensor1) {
		throw new Response('Sensor 1 not found', { status: 404 })
	}

	const compareCandidates = await getComparableSensors(sensor1)

	return {
		device,
		sensors,
		compareCandidates,
		startDate,
		endDate,
		aggregation,
	}
}

export default function SensorView() {
	const loaderData = useLoaderData<typeof loader>()

	return (
		<>
			<Graph
				aggregation={loaderData.aggregation}
				sensors={loaderData.sensors}
				compareCandidates={loaderData.compareCandidates}
			/>
			{loaderData.device?.exposure === 'mobile' && (
				<MobileBoxView sensors={loaderData.sensors} />
			)}
		</>
	)
}
