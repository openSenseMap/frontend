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

import { DeviceSensorPathParamsSchema } from '~/lib/openapi/schemas/common'

import {
	ForbiddenErrorSchema,
	InternalServerErrorSchema,
	MethodNotAllowedErrorSchema,
	NotFoundErrorSchema,
	createBadRequestErrorSchema,
} from '~/lib/openapi/errors'

import {
	badRequestResponse,
	forbiddenResponse,
	internalServerErrorResponse,
	methodNotAllowedResponse,
	notFoundResponse,
} from '~/lib/openapi/errors'

const DeleteSensorMeasurementsQueryParamsSchema = z
	.object({
		'from-date': z.iso.datetime().optional().meta({
			description:
				'Beginning date of the measurement range to delete. Must be used together with `to-date`.',
			example: '2026-05-13T12:00:00.000Z',
		}),

		'to-date': z.iso.datetime().optional().meta({
			description:
				'End date of the measurement range to delete. Must be used together with `from-date`.',
			example: '2026-05-15T12:00:00.000Z',
		}),

		timestamps: z
			.union([z.iso.datetime(), z.array(z.iso.datetime())])
			.optional()
			.meta({
				description:
					'One or more exact measurement timestamps to delete. Do not use together with `from-date` / `to-date` or `deleteAllMeasurements`.',
				example: ['2026-05-15T12:00:00.000Z'],
			}),

		deleteAllMeasurements: z.enum(['true', 'false']).optional().meta({
			description:
				'Set to `true` to delete all measurements of this sensor. Must be used by itself.',
			example: 'true',
		}),
	})
	.meta({
		id: 'DeleteSensorMeasurementsQueryParams',
		description:
			'Query parameters selecting which measurements should be deleted.',
	})

const DeleteSensorMeasurementsResponseSchema = z
	.object({
		message: z.string().meta({
			example: 'Successfully deleted 42 of sensor 60a13611a877b3001b8ffd59',
		}),
	})
	.meta({
		id: 'DeleteSensorMeasurementsResponse',
		description: 'Response returned after deleting measurements from a sensor.',
	})

const DeleteSensorMeasurementsBadRequestErrorSchema =
	createBadRequestErrorSchema({
		id: 'DeleteSensorMeasurementsBadRequestError',
		description:
			'Bad request. This can happen for invalid path parameters, invalid dates, invalid timestamp values, missing selection parameters, or mutually exclusive deletion parameters.',
		examples: [
			'Invalid device id or sensor id specified',
			'from-date is invalid',
			'to-date is invalid',
			'timestamps contains invalid input',
			'Parameter deleteAllMeasurements can only be used by itself',
			'Please specify only timestamps or a range with from-date and to-date',
		],
	})

const parseQueryParams = async (
	request: Request,
): Promise<z.infer<typeof DeleteSensorMeasurementsQueryParamsSchema>> => {
	const url = new URL(request.url)
	const params: Record<string, any> = Object.fromEntries(url.searchParams)
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
			200: {
				description: 'Measurements deleted successfully.',
				content: {
					'application/json': {
						schema: DeleteSensorMeasurementsResponseSchema,
					},
				},
			},

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

			if (parsedParams.deleteAllMeasurements)
				count = (await deleteMeasurementsForSensor(sensorId)).count
			else if (parsedParams.timestamps)
				count = (
					await deleteSensorMeasurementsForTimes(
						sensorId,
						//@ts-ignore
						parsedParams.timestamps,
					)
				).count
			else if (parsedParams['from-date'] && parsedParams['to-date'])
				count = (
					await deleteSensorMeasurementsForTimeRange(
						sensorId,
						//@ts-ignore
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
