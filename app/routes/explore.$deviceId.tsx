import { useState } from 'react'
import { Outlet, useLoaderData } from 'react-router'
import { type Route } from './+types/explore.$deviceId'
import DeviceDetailBox from '~/components/device-detail/device-detail-box'
import { HoveredPointContext } from '~/components/map/layers/mobile/mobile-box-layer'
import MobileOverviewLayer from '~/components/map/layers/mobile/mobile-overview-layer'
import { getDevice } from '~/db/models/device.server'
import { getSensorsWithLastMeasurement } from '~/db/models/sensor.server'
import { getLatestTripPoints } from '~/lib/mobile-box-helper'
import { getDeviceImageUrl } from '~/lib/s3.server'
import { getLocale } from '~/middleware/i18next'

export async function loader({ context, params, request }: Route.LoaderArgs) {
	const locale = getLocale(context)
	// Extracting the selected sensors from the URL query parameters using the stringToArray function
	const url = new URL(request.url)

	if (!params.deviceId) {
		throw new Response('Device not found', { status: 502 })
	}

	const device = await getDevice({ id: params.deviceId })
	const sensorsWithLastestMeasurement = await getSensorsWithLastMeasurement(
		params.deviceId,
	)

	// Keep the payload and map readable by showing the latest mobile trips.
	if (device?.exposure === 'mobile' && device?.locations) {
		const formattedLocations = device.locations.map((location) => ({
			time: String(location.time),
			geometry: location.geometry,
		}))
		const latestPointTimes = new Set(
			getLatestTripPoints(formattedLocations).map((location) => location.time),
		)

		device.locations = device.locations.filter((location) =>
			latestPointTimes.has(String(location.time)),
		)
	}

	// Find all sensors from the device response that have the same id as one of the sensor array value
	const aggregation = url.searchParams.get('aggregation') || 'raw'
	const startDate = url.searchParams.get('date_from') || undefined
	const endDate = url.searchParams.get('date_to') || undefined

	let deviceImageUrl: string | null = null

	if (device?.image) {
		try {
			deviceImageUrl = await getDeviceImageUrl(device.image)
		} catch (error) {
			console.error('Failed to create signed device image URL:', error)
		}
	}

	// Combine the device data with the selected sensors and return the result as JSON + add env variable
	const data = {
		device,
		deviceImageUrl,
		sensors: sensorsWithLastestMeasurement,
		aggregation,
		fromDate: startDate,
		toDate: endDate,
		OSEM_API_URL: process.env.OSEM_API_URL,
		locale,
	}

	return data
}

// Defining the component that will render the page
export default function DeviceId() {
	// Retrieving the data returned by the loader using the useLoaderData hook
	const data = useLoaderData<typeof loader>()
	const [hoveredPoint, setHoveredPoint] = useState(null)

	const setHoveredPointDebug = (point: any) => {
		setHoveredPoint(point)
	}

	if (!data?.device && !data.sensors) {
		return null
	}

	return (
		<>
			<HoveredPointContext.Provider
				value={{ hoveredPoint, setHoveredPoint: setHoveredPointDebug }}
			>
				{/* Keep the canonical device trips visible while sensors are selected. */}
				{data.device?.exposure === 'mobile' &&
					Array.isArray(data.device?.locations) &&
					data.device.locations.length > 0 && (
						<MobileOverviewLayer
							locations={data.device.locations.map((location) => ({
								time: String(location.time),
								geometry: location.geometry,
							}))}
						/>
					)}
				<DeviceDetailBox />
				<Outlet />
			</HoveredPointContext.Provider>
		</>
	)
}
