import { type ActionFunctionArgs, redirect } from 'react-router'

/**
 * Following REST and the other routes, we should forward
 * to a consistent route schema and use
 *     /boxes/:deviceId/sensors/:sensorId/measurements
 * instead of
 *     /boxes/:deviceId/:sensorId/measurements
 */
export async function action({ params }: ActionFunctionArgs) {
	const MEASUREMENTS_ROUTE = `/api/boxes/${params.deviceId}/sensors/${params.sensorId}/measurements`
	return redirect(MEASUREMENTS_ROUTE, {
		status: 308, // Permanent Redirect
	})
}
