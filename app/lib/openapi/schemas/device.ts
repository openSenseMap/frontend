import * as z from 'zod/v4'
import 'zod-openapi'

export const GeoJsonPointSchema = z
	.object({
		type: z.literal('Point'),
		coordinates: z.tuple([z.number(), z.number()]).meta({
			description: '[longitude, latitude]',
			example: [13.404954, 52.520008],
		}),
	})
	.meta({
		id: 'GeoJsonPoint',
		description: 'GeoJSON Point geometry.',
	})

export const ApiSensorSchema = z
	.looseObject({
		_id: z.string().optional().meta({
			description: 'Sensor id in API format',
			example: 'sensor123',
		}),
		id: z.string().optional().meta({
			description: 'Sensor id',
			example: 'sensor123',
		}),
		title: z.string().nullable().optional().meta({
			description: 'Sensor title',
			example: 'Temperature',
		}),
		unit: z.string().nullable().optional().meta({
			description: 'Sensor unit',
			example: '°C',
		}),
		sensorType: z.string().nullable().optional().meta({
			description: 'Sensor type',
			example: 'HDC1080',
		}),
		lastMeasurement: z
			.object({
				createdAt: z.string().datetime().optional().meta({
					example: '2023-01-01T00:00:00.000Z',
				}),
				value: z.union([z.string(), z.number()]).nullable().optional().meta({
					example: '25.13',
				}),
			})
			.nullable()
			.optional(),
	})
	.meta({
		id: 'ApiSensor',
		description: 'Sensor belonging to a box/device.',
	})

export const ApiDeviceSchema = z
	.looseObject({
		_id: z.string().optional().meta({
			description: 'Unique device identifier in API format',
			example: 'clx1234567890abcdef',
		}),
		id: z.string().optional().meta({
			description: 'Unique device identifier',
			example: 'clx1234567890abcdef',
		}),
		name: z.string().optional().meta({
			description: 'Device name',
			example: 'My Weather Station',
		}),
		description: z.string().nullable().optional().meta({
			description: 'Device description',
			example: 'A weather monitoring station',
		}),
		image: z.string().nullable().optional().meta({
			description: 'Device image URL',
			example: 'https://example.com/image.jpg',
		}),
		link: z.string().nullable().optional().meta({
			description: 'Device website link',
			example: 'https://example.com',
		}),
		grouptag: z
			.array(z.string())
			.optional()
			.meta({
				description: 'Device group tags',
				example: ['weather', 'outdoor'],
			}),
		exposure: z.string().nullable().optional().meta({
			description: 'Device exposure type',
			example: 'outdoor',
		}),
		model: z.string().nullable().optional().meta({
			description: 'Device model',
			example: 'homeV2Wifi',
		}),
		latitude: z.number().nullable().optional().meta({
			description: 'Device latitude',
			example: 52.520008,
		}),
		longitude: z.number().nullable().optional().meta({
			description: 'Device longitude',
			example: 13.404954,
		}),
		useAuth: z.boolean().optional().meta({
			description: 'Whether the device requires authentication',
			example: true,
		}),
		public: z.boolean().optional().meta({
			description: 'Whether the device is public',
			example: false,
		}),
		status: z.string().nullable().optional().meta({
			description: 'Device status',
			example: 'inactive',
		}),
		createdAt: z.string().datetime().optional().meta({
			description: 'Device creation timestamp',
			example: '2024-01-15T10:30:00.000Z',
		}),
		updatedAt: z.string().datetime().optional().meta({
			description: 'Device last update timestamp',
			example: '2024-01-15T10:30:00.000Z',
		}),
		expiresAt: z.string().datetime().nullable().optional().meta({
			description: 'Device expiration date',
			example: '2024-12-31T23:59:59.000Z',
		}),
		userId: z.string().optional().meta({
			description: 'Owner user id',
			example: 'user_123456',
		}),
		sensorWikiModel: z.string().nullable().optional().meta({
			description: 'Sensor Wiki model identifier',
			example: 'homeV2Wifi',
		}),
		currentLocation: z
			.object({
				type: z.literal('Point'),
				coordinates: z.tuple([z.number(), z.number()]),
				timestamp: z.string().datetime().optional(),
			})
			.optional()
			.meta({
				description: 'Current location as GeoJSON Point-like object',
			}),
		lastMeasurementAt: z.string().datetime().nullable().optional().meta({
			description: 'Last measurement timestamp',
			example: '2023-01-01T00:00:00.000Z',
		}),
		loc: z.array(z.looseObject({})).optional().meta({
			description: 'Location history as GeoJSON features',
		}),
		integrations: z
			.looseObject({})
			.optional()
			.meta({
				description: 'Device integrations',
				example: {
					mqtt: {
						enabled: false,
					},
				},
			}),
		sensors: z.array(ApiSensorSchema).optional().meta({
			description: 'Sensors belonging to this device',
		}),
	})
	.meta({
		id: 'ApiDevice',
		description:
			'Device object returned by the API. Additional fields may be included depending on the database model and API transformation.',
	})

export const DevicesResponseSchema = z.array(ApiDeviceSchema).meta({
	id: 'DevicesResponse',
	description: 'List of devices.',
})

export const DevicesGeoJsonResponseSchema = z
	.object({
		type: z.literal('FeatureCollection'),
		features: z.array(
			z.object({
				type: z.literal('Feature'),
				geometry: GeoJsonPointSchema,
				properties: ApiDeviceSchema,
			}),
		),
	})
	.meta({
		id: 'DevicesGeoJsonResponse',
		description:
			'GeoJSON FeatureCollection of devices. Returned when `format=geojson`.',
		example: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [13.404954, 52.520008],
					},
					properties: {
						id: 'clx1234567890abcdef',
						name: 'My Weather Station',
					},
				},
			],
		},
	})
