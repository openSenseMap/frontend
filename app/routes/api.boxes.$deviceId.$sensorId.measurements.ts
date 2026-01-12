import { type ActionFunctionArgs, redirect } from 'react-router'
import { getUserFromJwt } from '~/lib/jwt'
import { getUserDevices } from '~/models/device.server'
import { deleteMeasurementsForSensor } from '~/models/measurement.server'
import { StandardResponse } from '~/utils/response-utils'

export async function action({ request, params }: ActionFunctionArgs) {
	try {
		const { deviceId, sensorId } = params
		if (!deviceId || !sensorId)
			return StandardResponse.badRequest(
				'Invalid device id or sensor id specified',
			)

		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string')
			return StandardResponse.forbidden(
				'Invalid JWT authorization. Please sign in to obtain new JWT.',
			)

		if (request.method !== 'DELETE')
			return StandardResponse.methodNotAllowed('Endpoint only supports DELETE')

		const userDevices = await getUserDevices(jwtResponse.id)
		if (!userDevices.some((d) => d.id === deviceId))
			return StandardResponse.forbidden(
				'You are not allowed to delete data of the given device',
			)

		const device = userDevices.find((d) => d.id === deviceId)
		if (!device?.sensors.some((s) => s.id === sensorId))
			return StandardResponse.forbidden(
				'You are not allowed to delete data of the given sensor',
			)

		// TODO add more parameters (from-date, to-date etc)
		await deleteMeasurementsForSensor(sensorId)
		return StandardResponse.ok({})
	} catch (err: any) {
		return StandardResponse.internalServerError(
			err.message || 'An unexpected error occured',
		)
	}
}
