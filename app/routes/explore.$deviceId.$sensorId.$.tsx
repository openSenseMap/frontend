import { addDays } from 'date-fns'
import { redirect, useLoaderData } from 'react-router'
import { type Route } from './+types/explore.$deviceId.$sensorId.$'
import Graph from '~/components/device-detail/graph'
import MobileBoxView from '~/components/map/layers/mobile/mobile-box-view'
import { getDevice } from '~/db/models/device.server'
import { getMeasurement } from '~/db/models/measurement.query.server'
import { getSensor } from '~/db/models/sensor.server'
import { type SensorWithMeasurementData } from '~/db/schema'
import {
	getLatestTripPoints,
	type LocationPoint,
} from '~/lib/mobile-box-helper'

interface SensorWithColor extends SensorWithMeasurementData {
	color: string
}

type RawMeasurement = {
	sensorId: string
	locationId: bigint | null
	time: Date
	value: number | null
	location: {
		id: bigint
		x: number
		y: number
	} | null
}

function prepareSensorData(
	measurements: RawMeasurement[],
	sensorId: string,
	limitToLatestTrips: boolean,
): SensorWithMeasurementData['data'] {
	const normalizedData = measurements.map((measurement) => ({
		...measurement,
		sensorId,
		locationId:
			measurement.locationId === null ? null : Number(measurement.locationId),
		location: measurement.location
			? {
					...measurement.location,
					id: Number(measurement.location.id),
				}
			: null,
	}))

	if (!limitToLatestTrips) return normalizedData

	const locationPoints: LocationPoint[] = normalizedData
		.filter((measurement) => measurement.location !== null)
		.map((measurement) => ({
			geometry: {
				x: measurement.location!.x,
				y: measurement.location!.y,
			},
			time: measurement.time.toISOString(),
		}))
	const latestPointTimes = new Set(
		getLatestTripPoints(locationPoints).map((point) => point.time),
	)

	return normalizedData.filter(
		(measurement) =>
			measurement.location !== null &&
			latestPointTimes.has(measurement.time.toISOString()),
	)
}

export async function loader({ params, request }: Route.LoaderArgs) {
	const { deviceId, sensorId } = params
	const sensorId2 = params['*']

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

	const sensor1 = (await getSensor(sensorId)) as SensorWithColor
	const sensor1Data = await getMeasurement(
		sensorId,
		aggregation,
		startDate ? new Date(startDate) : undefined,
		endDate ? addDays(new Date(endDate), 1) : undefined,
	)

	sensor1.data = prepareSensorData(
		sensor1Data as RawMeasurement[],
		sensorId,
		device.exposure === 'mobile' && !startDate,
	)
	sensor1.color = sensor1.color || '#8da0cb'

	let sensor2: SensorWithColor | null = null

	if (sensorId2) {
		sensor2 = (await getSensor(sensorId2)) as SensorWithColor
		const sensor2Data = await getMeasurement(
			sensorId2,
			aggregation,
			startDate ? new Date(startDate) : undefined,
			endDate ? addDays(new Date(endDate), 1) : undefined,
		)

		sensor2.data = prepareSensorData(
			sensor2Data as RawMeasurement[],
			sensorId2,
			device.exposure === 'mobile' && !startDate,
		)
		sensor2.color = sensor2.color || '#fc8d62'
	}

	return {
		device,
		sensors: sensor2 ? [sensor1, sensor2] : [sensor1],
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
			/>
			{loaderData.device?.exposure === 'mobile' && (
				<MobileBoxView sensors={loaderData.sensors} />
			)}
		</>
	)
}
