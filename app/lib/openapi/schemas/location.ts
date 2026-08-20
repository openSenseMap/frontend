import z from 'zod/v4'

export const CoordinatesSchema = z.tuple([z.number(), z.number()]).meta({
	description: '[longitude, latitude]',
	example: [7.68123, 51.9123],
})

export const CoordinatesWithHeightSchema = z
	.tuple([z.number(), z.number(), z.number().optional()])
	.meta({
		id: 'CoordinatesWithHeight',
		description:
			'[longitude, latitude, height?], where height is above sea level in meters',
		example: [7.68123, 51.9123, 66.6],
	})

export const LongitudeLatitudeLocationObjectSchema = z
	.object({
		longitude: z.number().meta({
			description: 'Longitude',
			example: 7.68123,
		}),
		latitude: z.number().meta({
			description: 'Latitude',
			example: 51.9123,
		}),
		height: z.number().optional().meta({
			description: 'Height above sea level in meters.',
			example: 66.6,
		}),
	})
	.meta({
		id: 'LongitudeLatitudeLocationObject',
		description:
			'Location object with longitude, latitude, and optional height.',
	})

export const LocationObjectSchema = z
	.object({
		lng: z.number().meta({
			description: 'Longitude',
			example: 7.68123,
		}),
		lat: z.number().meta({
			description: 'Latitude',
			example: 51.9123,
		}),
		height: z.number().optional().meta({
			description: 'Height above sea level in meters.',
			example: 66.6,
		}),
	})
	.meta({
		id: 'LocationObject',
		description:
			'Location object with longitude, latitude, and optional height.',
	})
	.or(LongitudeLatitudeLocationObjectSchema)
	.transform((location) => {
		if ('lng' in location) return location

		return {
			lng: location.longitude,
			lat: location.latitude,
			height: location.height,
		}
	})

const DeviceHeightAboveGroundSchema = z.number().finite().optional().meta({
	description:
		'Device height above the local ground surface in meters, not an absolute height above sea level. The server adds terrain elevation before storing the device height.',
	example: 3.5,
})

export const DeviceLocationInputSchema = z
	.union([
		z.object({
			lng: z.number().meta({
				description: 'Longitude',
				example: 7.68123,
			}),
			lat: z.number().meta({
				description: 'Latitude',
				example: 51.9123,
			}),
			height: DeviceHeightAboveGroundSchema,
		}),
		z.object({
			longitude: z.number().meta({
				description: 'Longitude',
				example: 7.68123,
			}),
			latitude: z.number().meta({
				description: 'Latitude',
				example: 51.9123,
			}),
			height: DeviceHeightAboveGroundSchema,
		}),
	])
	.transform((location) => {
		if ('lng' in location) return location

		return {
			lng: location.longitude,
			lat: location.latitude,
			height: location.height,
		}
	})
	.meta({
		id: 'DeviceLocationInput',
		description:
			'Device coordinates with an optional height above ground. When height is supplied, the server resolves terrain elevation and stores the resulting height above sea level. When omitted, creation leaves height unset and an update preserves the existing height.',
	})

export const GeoJsonPointSchema = z
	.object({
		type: z.literal('Point'),
		coordinates: CoordinatesWithHeightSchema,
	})
	.meta({
		id: 'GeoJsonPoint',
		description: 'GeoJSON Point geometry.',
	})

export const TimestampedGeoJsonPointSchema = GeoJsonPointSchema.extend({
	timestamp: z.iso.datetime().optional().meta({
		description: 'Timestamp associated with the location.',
		example: '2023-01-01T00:00:00.000Z',
	}),
}).meta({
	id: 'TimestampedGeoJsonPoint',
	description: 'GeoJSON Point-like object with an optional timestamp.',
})
