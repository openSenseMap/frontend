import { z } from 'zod'

export const CreateDeviceSchema = z.object({
	// public API request shape
	name: z.string().min(1).max(100),
	description: z
		.string()
		.max(5000, 'Description should not exceed 5000 characters')
		.optional()
		.nullable(),
	exposure: z
		.enum(['indoor', 'outdoor', 'mobile', 'unknown'])
		.optional()
		.default('unknown'),
	location: z
		.union([
			z
				.array(z.number())
				.min(2)
				.max(3)
				.meta({
					description:
						'Coordinates as [longitude, latitude, height?], where height is above sea level in meters.',
					example: [7.68123, 51.9123, 66.6],
				}),
			z
				.object({
					lng: z.number().meta({ description: 'Longitude' }),
					lat: z.number().meta({ description: 'Latitude' }),
					height: z.number().optional().meta({
						description: 'Height above sea level in meters.',
						example: 66.6,
					}),
				})
				.meta({
					description:
						'Device location with an optional height above sea level in meters.',
				}),
		])
		.transform((loc) => {
			if (Array.isArray(loc)) return loc
			return [
				loc.lng,
				loc.lat,
				...(loc.height !== undefined ? [loc.height] : []),
			]
		}),
	grouptag: z.array(z.string()).optional().default([]),
	model: z
		.enum([
			'homeV2Lora',
			'homeV2Ethernet',
			'homeV2Wifi',
			'senseBox:Edu',
			'luftdaten.info',
			'custom',
		])
		.optional()
		.default('custom'),
	sensors: z
		.array(
			z.object({
				icon: z.string().optional(),
				title: z.string().min(1),
				unit: z.string().min(1),
				sensorType: z.string().min(1),
			}),
		)
		.optional()
		.default([]),
})

export const DevicesQuerySchema = z.object({
	format: z
		.enum(['json', 'geojson'], {
			error: () => "Format must be either 'json' or 'geojson'",
		})
		.default('json'),
	minimal: z
		.enum(['true', 'false'])
		.default('false')
		.transform((v) => v === 'true'),
	full: z
		.enum(['true', 'false'])
		.default('false')
		.transform((v) => v === 'true'),
	limit: z
		.string()
		.default('5')
		.transform((val) => parseInt(val, 10))
		.refine((val) => !isNaN(val), { message: 'Limit must be a number' })
		.refine((val) => val >= 1, { message: 'Limit must be at least 1' })
		.refine((val) => val <= 20, { message: 'Limit must not exceed 20' }),

	name: z.string().optional(),
	date: z
		.preprocess(
			(val) => {
				if (typeof val === 'string') return [val]
				if (Array.isArray(val)) return val
				return val
			},
			z
				.array(z.string())
				.min(1, 'At least one date required')
				.max(2, 'At most two dates allowed')
				.transform((arr) => {
					const [fromDateStr, toDateStr] = arr
					const fromDate = new Date(fromDateStr)
					if (isNaN(fromDate.getTime()))
						throw new Error(`Invalid date: ${fromDateStr}`)

					if (!toDateStr) {
						return {
							fromDate: new Date(fromDate.getTime() - 4 * 60 * 60 * 1000),
							toDate: new Date(fromDate.getTime() + 4 * 60 * 60 * 1000),
						}
					}

					const toDate = new Date(toDateStr)
					if (isNaN(toDate.getTime()))
						throw new Error(`Invalid date: ${toDateStr}`)
					return { fromDate, toDate }
				}),
		)
		.optional(),
	phenomenon: z.string().optional(),
	grouptag: z
		.string()
		.transform((v) => [v])
		.optional(),
	model: z
		.string()
		.transform((v) => [v])
		.optional(),
	exposure: z
		.string()
		.transform((v) => [v])
		.optional(),

	near: z
		.string()
		.regex(/^[-+]?\d+(\.\d+)?,[-+]?\d+(\.\d+)?$/, {
			message: "Invalid 'near' parameter format. Expected: 'lat,lng'",
		})
		.transform((val) => val.split(',').map(Number) as [number, number])
		.optional(),

	maxDistance: z
		.string()
		.transform((v) => Number(v))
		.optional(),

	bbox: z
		.string()
		.transform((val) => {
			const coords = val.split(',').map(Number)
			if (coords.length !== 4 || coords.some((n) => isNaN(n))) {
				throw new Error('Invalid bbox parameter')
			}
			const [swLng, swLat, neLng, neLat] = coords
			return {
				coordinates: [
					[
						[swLat, swLng],
						[neLat, swLng],
						[neLat, neLng],
						[swLat, neLng],
						[swLat, swLng],
					],
				],
			}
		})
		.optional(),

	fromDate: z
		.string()
		.datetime()
		.transform((v) => new Date(v))
		.optional(),
	toDate: z
		.string()
		.datetime()
		.transform((v) => new Date(v))
		.optional(),
})
