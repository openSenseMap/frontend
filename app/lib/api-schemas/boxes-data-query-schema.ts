import { z } from 'zod'
import { type DeviceExposureType } from '~/schema'
import { StandardResponse } from '~/utils/response-utils'

export type BoxesDataColumn =
	| 'createdAt'
	| 'value'
	| 'lat'
	| 'lon'
	| 'height'
	| 'boxId'
	| 'boxName'
	| 'exposure'
	| 'sensorId'
	| 'phenomenon'
	| 'unit'
	| 'sensorType'

const BoxesDataQuerySchemaBase = z
	.object({
		phenomenon: z.string().optional(),

		boxId: z
			.union([
				z.string().transform((s) => s.split(',').map((x) => x.trim())),
				z
					.array(z.string())
					.transform((arr) => arr.map((s) => String(s).trim())),
			])
			.optional(),
		bbox: z
			.union([
				z.string().transform((s) => s.split(',').map((x) => Number(x.trim()))),
				z
					.array(z.union([z.string(), z.number()]))
					.transform((arr) => arr.map((x) => Number(x))),
			])
			.refine((arr) => arr.length === 4 && arr.every((n) => !isNaN(n)), {
				message: 'bbox must contain exactly 4 numeric coordinates',
			})
			.optional(),

		exposure: z
			.union([
				z
					.string()
					.transform((s) =>
						s.split(',').map((x) => x.trim() as DeviceExposureType),
					),
				z
					.array(z.string())
					.transform((arr) =>
						arr.map((s) => String(s).trim() as DeviceExposureType),
					),
			])
			.optional(),

		grouptag: z.string().optional(),

		fromDate: z
			.string()
			.transform((s) => new Date(s))
			.refine((d) => !isNaN(d.getTime()), {
				message: 'from-date is invalid',
			})
			.optional()
			.default(() =>
				new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
			),
		toDate: z
			.string()
			.transform((s) => new Date(s))
			.refine((d) => !isNaN(d.getTime()), {
				message: 'to-date is invalid',
			})
			.optional()
			.default(() => new Date().toISOString()),

		format: z
			.enum(['csv', 'json'], {
				errorMap: () => ({ message: "Format must be either 'csv' or 'json'" }),
			})
			.default('csv'),

		// Columns to include
		columns: z
			.union([
				z
					.string()
					.transform((s) =>
						s.split(',').map((x) => x.trim() as BoxesDataColumn),
					),
				z
					.array(z.string())
					.transform((arr) =>
						arr.map((s) => String(s).trim() as BoxesDataColumn),
					),
			])
			.default([
				'sensorId',
				'createdAt',
				'value',
				'lat',
				'lon',
			] as BoxesDataColumn[]),

		download: z
			.union([z.string(), z.boolean()])
			.transform((v) => {
				if (typeof v === 'boolean') return v
				return v !== 'false' && v !== '0'
			})
			.default(true),

		delimiter: z.enum(['comma', 'semicolon']).default('comma'),
	})
	// Validate: must have boxId or bbox, but not both
	.superRefine((data, ctx) => {
		if (!data.boxId && !data.bbox && !data.grouptag) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'please specify either boxId, bbox or grouptag',
				path: ['boxId'],
			})
		}

		if (!data.phenomenon && !data.grouptag) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'phenomenon parameter is required when grouptag is not provided',
				path: ['phenomenon'],
			})
		}
	})

export type BoxesDataQueryParams = z.infer<typeof BoxesDataQuerySchemaBase>

/**
 * Parse and validate query parameters from request.
 * Supports both GET query params and POST JSON body.
 */
export async function parseBoxesDataQuery(
	request: Request,
): Promise<BoxesDataQueryParams> {
	const url = new URL(request.url)
	const queryParams = url.searchParams

	// For POST requests, try to parse JSON body
	let jsonBody: Record<string, any> | null = null
	if (request.method !== 'GET') {
		const contentType = request.headers.get('content-type') || ''
		if (contentType.includes('application/json')) {
			try {
				jsonBody = await request.json()
			} catch {
				jsonBody = null
			}
		}
	}

	const getParam = (names: string[]): any => {
		for (const name of names) {
			if (queryParams.has(name)) {
				return queryParams.get(name)
			}
		}
		if (jsonBody) {
			for (const name of names) {
				if (Object.prototype.hasOwnProperty.call(jsonBody, name)) {
					return jsonBody[name]
				}
			}
		}
		return undefined
	}

	const normalizedParams = {
		phenomenon: getParam(['phenomenon']),
		boxId: getParam(['boxId', 'boxid']), // boxId in docs, but effectively boxid was used, so support both?
		bbox: getParam(['bbox']),
		exposure: getParam(['exposure']),
		grouptag: getParam(['grouptag']),
		fromDate: getParam(['from-date']),
		toDate: getParam(['to-date']),
		format: getParam(['format']),
		columns: getParam(['columns']),
		download: getParam(['download']),
		delimiter: getParam(['delimiter']),
	}

	const cleanParams = Object.fromEntries(
		Object.entries(normalizedParams).filter(([_, v]) => v !== undefined),
	)

	const parseResult = BoxesDataQuerySchemaBase.safeParse(cleanParams)

	if (!parseResult.success) {
		const firstError = parseResult.error.errors[0]
		const message = firstError.message || 'Invalid query parameters'

		if (firstError.path.includes('bbox')) {
			throw StandardResponse.unprocessableContent(message)
		}
		throw StandardResponse.badRequest(message)
	}

	return parseResult.data
}
