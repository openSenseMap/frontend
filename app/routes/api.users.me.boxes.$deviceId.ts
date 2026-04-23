import { type Route } from './+types/api.users.me.boxes.$deviceId'
import { getDevice } from '~/db/models/device.server'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string')
			return StandardResponse.forbidden(
				'Invalid JWT authorization. Please sign in to obtain new JWT.',
			)
		const user = jwtResponse

		const deviceId = params.deviceId
		if (deviceId === undefined)
			return StandardResponse.badRequest('Invalid device id specified')

		const box = await getDevice({ id: deviceId })
		if (box === undefined)
			return StandardResponse.badRequest(
				'There is no such device with the given id',
			)

		if (box.user.id !== user.id)
			return StandardResponse.forbidden('User does not own this senseBox')

		return StandardResponse.ok({ code: 'Ok', data: { box: box } })
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
