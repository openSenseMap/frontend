import { type Route } from './+types/api.users.me.boxes'
import { getUserDevices } from '~/db/models/device.server'
import { enrichDevicesWithIntegrations } from '~/db/models/integration.server'
import { transformDeviceToApiFormat } from '~/lib/device-transform'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/utils/response-utils'

export const loader = async ({ request }: Route.LoaderArgs) => {
	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string') {
			return StandardResponse.forbidden(
				'Invalid JWT authorization. Please sign in to obtain new JWT.',
			)
		}

		const userBoxes = await getUserDevices(jwtResponse.id)
		const transformedBoxes = userBoxes.map((box) =>
			transformDeviceToApiFormat(box),
		)
		const boxesWithIntegrations =
			await enrichDevicesWithIntegrations(transformedBoxes)

		return StandardResponse.ok({
			code: 'Ok',
			data: {
				boxes: boxesWithIntegrations,
				boxes_count: boxesWithIntegrations.length,
				sharedBoxes: [],
			},
		})
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
