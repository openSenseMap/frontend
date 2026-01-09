import { type ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { getDevice } from '~/models/device.server'
import { saveMeasurements } from '~/models/measurement.server'
import { StandardResponse } from '~/utils/response-utils'

const MeasurementSchema = z.object({
	sensor_id: z.string(),
	value: z.number(),
	createdAt: z.string().datetime(),
	location: z
		.object({
			lat: z.number(),
			lng: z.number(),
			altitude: z.number().optional(),
		})
		.optional(),
})

const BatchMeasurementSchema = z.object({
	deviceId: z.string(),
	measurements: z.array(MeasurementSchema),
})

export async function action({ request }: ActionFunctionArgs) {
	try {
		let body
		try {
			body = await request.json()
		} catch (err) {
			return StandardResponse.badRequest('Invalid JSON in request body')
		}

		const validationResult = BatchMeasurementSchema.safeParse(body)
		if (!validationResult.success) {
			return StandardResponse.badRequest(
				validationResult.error.errors[0].message,
			)
		}

		const { deviceId, measurements: rawMeasurements } = validationResult.data

		const device = await getDevice({ id: deviceId })
		if (!device) {
			return StandardResponse.notFound('Device not found')
		}

		if (!device.sensors || device.sensors.length === 0) {
			return StandardResponse.badRequest('Device has no sensors configured')
		}

		const measurements = rawMeasurements.map((m) => ({
			sensor_id: m.sensor_id,
			value: m.value,
			createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
			location: m.location,
		}))

		try {
			await saveMeasurements(device, measurements)
		} catch (saveErr) {
			// Still return 202
		}

		return new Response(null, { status: 202 })
	} catch (err) {
		if (err instanceof Response) throw err
		return StandardResponse.internalServerError()
	}
}
