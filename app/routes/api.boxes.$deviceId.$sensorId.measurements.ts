import { type ActionFunctionArgs } from 'react-router'
import z from 'zod'
import { getUserFromJwt } from '~/lib/jwt'
import { getUserDevices } from '~/models/device.server'
import {
	deleteMeasurementsForSensor,
	deleteSensorMeasurementsForTimeRange,
	deleteSensorMeasurementsForTimes,
} from '~/models/measurement.server'
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

		try {
			const parsedParams = await parseQueryParams(request)
			let count = 0

			if (parsedParams.deleteAllMeasurements)
				count = (await deleteMeasurementsForSensor(sensorId)).count
			else if (parsedParams.timestamps)
				count = (
					await deleteSensorMeasurementsForTimes(
						sensorId,
						parsedParams.timestamps,
					)
				).count
			else if (parsedParams['from-date'] && parsedParams['to-date'])
				count = (
					await deleteSensorMeasurementsForTimeRange(
						sensorId,
						parsedParams['from-date'],
						parsedParams['to-date'],
					)
				).count

			return StandardResponse.ok({
				message: `Successfully deleted ${count} of sensor ${sensorId}`,
			})
		} catch (e) {
			if (e instanceof Response) return e
			else throw e
		}
	} catch (err: any) {
		return StandardResponse.internalServerError(
			err.message || 'An unexpected error occured',
		)
	}
}

const DeleteQueryParams = z
	.object({
		'from-date': z
			.string()
			.transform((s) => new Date(s))
			.refine((d) => !isNaN(d.getTime()), {
				message: 'from-date is invalid',
			})
			.optional(),
		'to-date': z
			.string()
			.transform((s) => new Date(s))
			.refine((d) => !isNaN(d.getTime()), {
				message: 'to-date is invalid',
			})
			.optional(),
		timestamps: z
			.preprocess((val) => {
				if (Array.isArray(val)) return val
				else return [val]
			}, z.array(z.string()))
			.transform((a) => a.map((i) => new Date(i)))
			.refine((a) => a.some((i) => !isNaN(i.getTime())), {
				message: 'timestamps contains invalid input',
			})
			.optional(),
		deleteAllMeasurements: z.coerce.boolean().optional(),
	})
	.superRefine((data, ctx) => {
		const fromDateSet = data['from-date'] !== undefined
		const toDateSet = data['to-date'] !== undefined
		const timestampsSet = data.timestamps !== undefined
		const deleteAllSet = data.deleteAllMeasurements !== undefined

		if (deleteAllSet && (timestampsSet || fromDateSet || toDateSet)) {
			const paths: string[] = []
			if (timestampsSet) paths.push('timestamps')
			if (fromDateSet) paths.push('from-date')
			if (toDateSet) paths.push('to-date')
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Parameter deleteAllMeasurements can only be used by itself',
				path: paths,
			})
		} else if (!deleteAllSet && timestampsSet && fromDateSet && toDateSet)
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'Please specify only timestamps or a range with from-date and to-date',
				path: ['timestamps', 'from-date', 'to-date'],
			})
		else if (!deleteAllSet && !timestampsSet && !fromDateSet && !toDateSet)
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'Please specify only timestamps or a range with from-date and to-date',
				path: ['timestamps', 'from-date', 'to-date'],
			})
	})

const parseQueryParams = async (
	request: Request,
): Promise<z.infer<typeof DeleteQueryParams>> => {
	const url = new URL(request.url)
	let params: Record<string, any>
	const contentType = request.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		try {
			params = await request.json()
		} catch {
			params = Object.fromEntries(url.searchParams)
		}
	} else {
		params = Object.fromEntries(url.searchParams)
	}

	const parseResult = DeleteQueryParams.safeParse(params)

	if (!parseResult.success) {
		const firstError = parseResult.error.errors[0]
		const message = firstError.message || 'Invalid query parameters'
		throw StandardResponse.badRequest(message)
	}

	return parseResult.data
}
