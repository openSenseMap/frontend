import { type Route } from './+types/api.boxes.$deviceId.$sensorId.measurements'
import { getUserDevices } from '~/db/models/device.server'
import {
	deleteMeasurementsForSensor,
	deleteSensorMeasurementsForTimeRange,
	deleteSensorMeasurementsForTimes,
} from '~/db/models/measurement.server'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'

import * as z from 'zod/v4'
import 'zod-openapi'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

import {
	DeviceSensorPathParamsSchema,
	IsoDateTimeSchema,
} from '~/lib/openapi/schemas/common'

import {
	ForbiddenErrorSchema,
	InternalServerErrorSchema,
	MethodNotAllowedErrorSchema,
	NotFoundErrorSchema,
	createBadRequestErrorSchema,
	messageResponse,
} from '~/lib/openapi/errors'

import {
	badRequestResponse,
	forbiddenResponse,
	internalServerErrorResponse,
	methodNotAllowedResponse,
	notFoundResponse,
} from '~/lib/openapi/errors'

const IsoDateTimeToDateSchema = IsoDateTimeSchema.transform(
	(value) => new Date(value),
)

const DeleteSensorMeasurementsQueryParamsSchema = z
	.object({
		'from-date': IsoDateTimeToDateSchema.optional().meta({
			description: 'Beginning date of the measurement range to delete.',
			example: '2026-05-13T12:00:00.000Z',
		}),

		'to-date': IsoDateTimeToDateSchema.optional().meta({
			description: 'End date of the measurement range to delete.',
			example: '2026-05-15T12:00:00.000Z',
		}),

		timestamps: z
			.union([IsoDateTimeToDateSchema, z.array(IsoDateTimeToDateSchema)])
			.optional()
			.transform((value) => {
				if (value === undefined) return undefined
				return Array.isArray(value) ? value : [value]
			})
			.meta({
				description: 'One or more exact measurement timestamps to delete.',
				example: ['2026-05-15T12:00:00.000Z'],
			}),

		deleteAllMeasurements: z.enum(['true', 'false']).optional().meta({
			description: 'Set to `true` to delete all measurements of this sensor.',
			example: 'true',
		}),
	})
	.meta({
		id: 'DeleteSensorMeasurementsQueryParams',
		description:
			'Query parameters selecting which measurements should be deleted.',
	})
const DeleteSensorMeasurementsBadRequestErrorSchema =
	createBadRequestErrorSchema({
		id: 'DeleteSensorMeasurementsBadRequestError',
		description:
			'Bad request. This can happen for invalid path parameters, invalid dates, or invalid timestamp values.',
		examples: [
			'Invalid device id or sensor id specified',
			'from-date is invalid',
			'to-date is invalid',
			'timestamps contains invalid input',
		],
	})

const parseQueryParams = async (
	request: Request,
): Promise<z.infer<typeof DeleteSensorMeasurementsQueryParamsSchema>> => {
	const url = new URL(request.url)
	const timestamps = url.searchParams.getAll('timestamps')

	const params = {
		'from-date': url.searchParams.get('from-date') ?? undefined,
		'to-date': url.searchParams.get('to-date') ?? undefined,
		deleteAllMeasurements:
			url.searchParams.get('deleteAllMeasurements') ?? undefined,
		timestamps:
			timestamps.length === 0
				? undefined
				: timestamps.length === 1
					? timestamps[0]
					: timestamps,
	}

	const parseResult =
		DeleteSensorMeasurementsQueryParamsSchema.safeParse(params)

	if (!parseResult.success) {
		const firstError = parseResult.error.issues[0]
		const message = firstError.message || 'Invalid query parameters'
		throw StandardResponse.badRequest(message)
	}

	return parseResult.data
}

export const openapi: ZodOpenApiPathItemObject = {
	delete: {
		tags: ['Measurements'],
		summary: 'Delete measurements of a sensor',
		description:
			'Deletes measurements for the specified sensor. The measurements to delete are selected via query parameters. You can delete all measurements, delete specific timestamps, or delete a time range using `from-date` and `to-date`.',
		operationId: 'deleteSensorMeasurements',
		security: [{ bearerAuth: [] }],

		requestParams: {
			path: DeviceSensorPathParamsSchema,
			query: DeleteSensorMeasurementsQueryParamsSchema,
		},

		responses: {
			200: messageResponse('Measurements deleted successfully.'),

			400: badRequestResponse(
				DeleteSensorMeasurementsBadRequestErrorSchema,
				'Bad request. This can happen for invalid query parameters or invalid parameter combinations.',
			),

			403: forbiddenResponse(
				ForbiddenErrorSchema,
				'Invalid JWT authorization or the authenticated user is not allowed to delete data of the given device.',
			),

			404: notFoundResponse(
				NotFoundErrorSchema,
				'Sensor not found or not part of this device.',
			),

			405: methodNotAllowedResponse(
				MethodNotAllowedErrorSchema,
				'Method not allowed. Endpoint only supports DELETE.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

export async function action({ request, params }: Route.ActionArgs) {
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
			return StandardResponse.notFound(
				`Sensor with id ${sensorId} not found or not part of this device`,
			)

		try {
			const parsedParams = await parseQueryParams(request)
			let count = 0

			if (parsedParams.deleteAllMeasurements === 'true')
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
