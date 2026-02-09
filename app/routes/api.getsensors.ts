import { type LoaderFunctionArgs } from 'react-router'
import { getSensors } from '~/models/sensor.server'
import { StandardResponse } from '~/utils/response-utils'

/**
 * @openapi
 * /api/getsensors:
 *   get:
 *     tags:
 *       - Sensors
 *     summary: Get sensors by device ID
 *     description: Returns a list of sensors associated with the specified device ID
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the device to fetch sensors for
 *         example: "device-123"
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sensor'
 *             example:
 *               - id: "sensor-1"
 *                 name: "Temperature Sensor"
 *                 type: "temperature"
 *               - id: "sensor-2"
 *                 name: "Humidity Sensor"
 *                 type: "humidity"
 *       400:
 *         description: Bad request - deviceId parameter is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "deviceId is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Failed to fetch sensors"
 *
 * components:
 *   schemas:
 *     Sensor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the sensor
 *           example: "sensor-1"
 *         name:
 *           type: string
 *           description: Human-readable name of the sensor
 *           example: "Temperature Sensor"
 *         type:
 *           type: string
 *           description: Type of sensor
 *           example: "temperature"
 *       required:
 *         - id
 *         - name
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const deviceId = url.searchParams.get('deviceId')
	if (!deviceId) return StandardResponse.badRequest('deviceId is required')
	try {
		const sensors = await getSensors(deviceId)
		return new Response(JSON.stringify(sensors), {
			status: 200,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'no-cache',
			},
		})
	} catch (error) {
		return StandardResponse.internalServerError('Failed to fetch sensors')
	}
}
