import { type Route } from './+types/api.boxes.$deviceId.sensors.$sensorId'
import { StandardResponse } from '~/lib/responses'
import { getLatestMeasurementsForSensor } from '~/services/measurement-service.server'

export const loader = async ({
	request,
	params,
}: Route.LoaderArgs): Promise<Response> => {
	try {
		const deviceId = params.deviceId
		if (deviceId === undefined)
			return StandardResponse.badRequest('Invalid device id specified')

		const sensorId = params.sensorId
		if (sensorId === undefined)
			return StandardResponse.badRequest('Invalid sensor id specified')

		const searchParams = new URL(request.url).searchParams
		const onlyValue =
			(searchParams.get('onlyValue')?.toLowerCase() ?? '') === 'true'
		if (sensorId === undefined && onlyValue)
			return StandardResponse.badRequest(
				'onlyValue can only be used when a sensor id is specified',
			)

		const meas = await getLatestMeasurementsForSensor(
			deviceId,
			sensorId,
			undefined,
		)

		if (meas == null) return StandardResponse.notFound('Device not found.')

		if (onlyValue)
			return StandardResponse.ok(meas['lastMeasurement']?.value ?? null)

		return StandardResponse.ok(
			{ ...meas, _id: meas.id } /* for legacy purposes */,
		)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
