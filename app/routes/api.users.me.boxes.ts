import { type LoaderFunction, type LoaderFunctionArgs } from 'react-router'
import { transformDeviceToApiFormat } from '~/lib/device-transform'
import { getUserFromJwt } from '~/lib/jwt'
import { getUserDevices } from '~/models/device.server'
import { StandardResponse } from '~/utils/response-utils'

export const loader: LoaderFunction = async ({
	request,
}: LoaderFunctionArgs) => {
	try {
		const jwtResponse = await getUserFromJwt(request)

		if (typeof jwtResponse === 'string')
			return StandardResponse.forbidden(
				'Invalid JWT authorization. Please sign in to obtain new JWT.',
			)

		const userBoxes = await getUserDevices(jwtResponse.id)
		const cleanedBoxes = userBoxes.map((box) => transformDeviceToApiFormat(box))

		return StandardResponse.ok({
			code: 'Ok',
			data: {
				boxes: cleanedBoxes,
				boxes_count: cleanedBoxes.length,
				sharedBoxes: [],
			},
		})
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
