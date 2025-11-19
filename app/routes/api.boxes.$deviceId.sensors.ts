import { type LoaderFunction, type LoaderFunctionArgs } from 'react-router'
import { getLatestMeasurements } from '~/lib/measurement-service.server'
import { StandardResponse } from '~/utils/response-utils'

/**
 * @openapi
 * /boxes/{deviceId}/sensors:
 *  get:
 *    tags:
 *      - Sensors
 *    summary: Get the latest measurements of all sensors of the specified senseBox.
 *    parameters:
 *      - in: path
 *        name: deviceId
 *        required: true
 *        schema:
 *          type: string
 *        description: the ID of the senseBox you are referring to
 *      - in: query
 *        name: count
 *        required: false
 *        schema:
 *          type: integer
 *          minimum: 1
 *          maximum: 100
 *        description: Number of measurements to be retrieved for every sensor
 *    responses:
 *       200:
 *         description: Success
 *         content:
 */

export const loader: LoaderFunction = async ({
	request,
	params,
}: LoaderFunctionArgs): Promise<Response> => {
	try {
		const deviceId = params.deviceId
		if (deviceId === undefined)
			return StandardResponse.badRequest('Invalid device id specified')

		const url = new URL(request.url)
		const countParam = url.searchParams.get('count')

		let count: undefined | number = undefined
		if (countParam !== null && Number.isNaN(countParam))
			return StandardResponse.badRequest(
				'Illegal value for parameter count. allowed values: numbers',
			)

		count = countParam === null ? undefined : Number(countParam)

		const meas = await getLatestMeasurements(deviceId, undefined, count)

		return StandardResponse.ok(meas)
	} catch (err) {
		console.warn(err)
		return StandardResponse.internalServerError()
	}
}
