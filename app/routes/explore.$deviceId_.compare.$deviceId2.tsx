import {
	type LoaderFunctionArgs,
	Outlet,
	redirect,
	useLoaderData,
} from 'react-router'
import CompareDeviceBox from '~/components/compare-devices/compare-device-box'

import i18next from '~/i18next.server'
import { getDevice, getDeviceWithoutSensors } from '~/models/device.server'
import { getSensorsWithLastMeasurement } from '~/models/sensor.server'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const locale = await i18next.getLocale(request)
	// Extracting the selected sensors from the URL query parameters using the stringToArray function
	const url = new URL(request.url)

	if (!params.deviceId) {
		// TODO: Alert user that device not found
		return redirect('/explore')
	}

	if (!params.deviceId2) {
		return redirect(`/explore/${params.deviceId}/compare`)
	}

	const device1 = await getDeviceWithoutSensors({ id: params.deviceId })
	const sensorsDevice1 = await getSensorsWithLastMeasurement(params.deviceId)
	const device1WithSensors = {
		...device1,
		sensors: sensorsDevice1,
	}

	const device2 = await getDevice({ id: params.deviceId2 })
	const sensorsDevice2 = await getSensorsWithLastMeasurement(params.deviceId2)
	const device2WithSensors = {
		...device2,
		sensors: sensorsDevice2,
	}

	const devices = [device1WithSensors, device2WithSensors]

	// Find all sensors from the device response that have the same id as one of the sensor array value
	const aggregation = url.searchParams.get('aggregation') || 'raw'
	const startDate = url.searchParams.get('date_from') || undefined
	const endDate = url.searchParams.get('date_to') || undefined

	// Combine the device data with the selected sensors and return the result as JSON + add env variable
	const data = {
		devices,
		aggregation,
		fromDate: startDate,
		toDate: endDate,
		OSEM_API_URL: process.env.OSEM_API_URL,
		locale,
	}

	return data
}

export default function CompareDevices() {
	const data = useLoaderData<typeof loader>()

	return (
		<>
			<CompareDeviceBox devicesWithSensors={data.devices} />
			<Outlet />
		</>
	)
}
