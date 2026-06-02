import { type Route } from './+types/api.stats'
import { StandardResponse } from '~/lib/responses'
import { getStatistics } from '~/services/statistics-service.server'

import * as z from 'zod/v4'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'

import {
	InternalServerErrorSchema,
	createBadRequestErrorSchema,
	badRequestResponse,
	internalServerErrorResponse,
} from '~/lib/openapi/errors'

const StatsQueryParamsSchema = z
	.object({
		human: z.enum(['true', 'false']).optional().meta({
			description:
				'If `true`, returns compact human-readable values instead of numbers.',
			example: 'false',
		}),
	})
	.meta({
		id: 'StatsQueryParams',
		description: 'Query parameters for statistics.',
	})

const NumericStatsResponseSchema = z
	.tuple([z.number(), z.number(), z.number()])
	.meta({
		id: 'NumericStatsResponse',
		description:
			'Statistics as numeric values: device count, sensor count, and measurement count from the last minute.',
		example: [318, 1024, 393],
	})

const HumanReadableStatsResponseSchema = z
	.tuple([z.string(), z.string(), z.string()])
	.meta({
		id: 'HumanReadableStatsResponse',
		description:
			'Statistics as compact human-readable strings: device count, sensor count, and measurement count from the last minute.',
		example: ['318', '1K', '393'],
	})

const StatsResponseSchema = z
	.union([NumericStatsResponseSchema, HumanReadableStatsResponseSchema])
	.meta({
		id: 'StatsResponse',
		description:
			'Statistics response. Returns numbers by default and compact strings when `human=true`.',
	})

const StatsBadRequestErrorSchema = createBadRequestErrorSchema({
	id: 'StatsBadRequestError',
	description:
		'Bad request. This happens when the `human` query parameter has an unsupported value.',
	examples: ['Illegal value for parameter human. allowed values: true, false'],
})

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['Statistics'],
		summary: 'Get platform statistics',
		description:
			'Returns platform statistics as an array with three values: the number of devices, the number of measurements, and the number of measurements recorded in the last minute. By default the values are numbers. If `human=true`, compact human-readable strings are returned.',

		requestParams: {
			query: StatsQueryParamsSchema,
		},

		responses: {
			200: {
				description: 'Statistics returned successfully.',
				content: {
					'application/json': {
						schema: StatsResponseSchema,
					},
				},
			},

			400: badRequestResponse(
				StatsBadRequestErrorSchema,
				'Bad request. The `human` query parameter must be either `true` or `false`.',
			),

			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Internal server error.',
			),
		},
	},
}

const parseStatsQueryParams = (request: Request) => {
	const url = new URL(request.url)
	const query = Object.fromEntries(url.searchParams)

	const parsed = StatsQueryParamsSchema.safeParse(query)

	if (!parsed.success) {
		return StandardResponse.badRequest(
			'Illegal value for parameter human. allowed values: true, false',
		)
	}

	return parsed.data
}

export async function loader({ request }: Route.LoaderArgs) {
	try {
		const query = parseStatsQueryParams(request)

		if (query instanceof Response) {
			return query
		}

		const humanReadable = query.human === 'true'
		const stats = await getStatistics(humanReadable)

		const responseParsed = await StatsResponseSchema.safeParseAsync(stats)

		if (!responseParsed.success) {
			console.warn(responseParsed.error)
			return StandardResponse.internalServerError()
		}

		return StandardResponse.ok(responseParsed.data)
	} catch (e) {
		console.warn(e)
		return StandardResponse.internalServerError()
	}
}
