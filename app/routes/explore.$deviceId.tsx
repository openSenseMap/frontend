import { useState } from 'react'
import {
	type LoaderFunctionArgs,
	Outlet,
	useLoaderData,
	useLocation,
	useMatches,
} from 'react-router'

import DeviceDetailBox from '~/components/device-overview/device-detail-box'
import { HoveredPointContext } from '~/components/map/layers/mobile/mobile-box-layer'
import MobileOverviewLayer from '~/components/map/layers/mobile/mobile-overview-layer'
import i18next from '~/i18next.server'
import { type LocationPoint } from '~/lib/mobile-box-helper'
import { getDevice } from '~/models/device.server'
import { getSensorsWithLastMeasurement } from '~/models/sensor.server'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const locale = await i18next.getLocale(request)
	// Extracting the selected sensors from the URL query parameters using the stringToArray function
	const url = new URL(request.url)

	if (!params.deviceId) {
		throw new Response('Device not found', { status: 502 })
	}

	const device = await getDevice({ id: params.deviceId })
	const sensorsWithLastestMeasurement = await getSensorsWithLastMeasurement(
		params.deviceId,
	)

	// Find all sensors from the device response that have the same id as one of the sensor array value
	const aggregation = url.searchParams.get('aggregation') || 'raw'
	const startDate = url.searchParams.get('date_from') || undefined
	const endDate = url.searchParams.get('date_to') || undefined

	// Combine the device data with the selected sensors and return the result as JSON + add env variable
	const data = {
		device: device,
		sensors: sensorsWithLastestMeasurement,
		aggregation: aggregation,
		fromDate: startDate,
		toDate: endDate,
		OSEM_API_URL: process.env.OSEM_API_URL,
		locale: locale,
	}

	return data
}

export default function DeviceId() {
	const data = useLoaderData<typeof loader>()
	const location = useLocation()
	const matches = useMatches()

	const compareMode = location.pathname.endsWith('/compare')

	const isSensorView = matches[matches.length - 1].params.sensorId
		? true
		: false
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
				{/* If the box is mobile, iterate over selected sensors and show trajectory */}
				{data.device?.exposure === 'mobile' && !isSensorView && (
					<MobileOverviewLayer
						locations={data.device.locations as unknown as LocationPoint[]}
					/>
				)}
				{!compareMode && <DeviceDetailBox />}
				<Outlet />
			</HoveredPointContext.Provider>
		</>
	)
}
