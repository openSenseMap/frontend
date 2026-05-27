import z from 'zod/v4'

export const CoordinatesSchema = z.tuple([z.number(), z.number()]).meta({
	description: '[longitude, latitude]',
	example: [7.68123, 51.9123],
})

export const CoordinatesWithHeightSchema = z
	.tuple([z.number(), z.number(), z.number().optional()])
	.meta({
		id: 'CoordinatesWithHeight',
		description: '[longitude, latitude, height?]',
		example: [7.68123, 51.9123, 66.6],
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
			description: 'Height above ground in meters.',
			example: 66.6,
		}),
	})
	.meta({
		id: 'LocationObject',
		description:
			'Location object with longitude, latitude, and optional height.',
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
			description: 'Height above ground in meters.',
			example: 66.6,
		}),
	})
	.meta({
		id: 'LongitudeLatitudeLocationObject',
		description:
			'Location object with longitude, latitude, and optional height.',
	})
