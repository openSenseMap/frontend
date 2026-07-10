import { z } from 'zod'

export const LOCATION_LIMITS = {
	latitude: {
		min: -90,
		max: 90,
	},
	longitude: {
		min: -180,
		max: 180,
	},
} as const

export const LOCATION_PRIVACY_VALUES = ['exact', 'masked'] as const
export const LOCATION_PRIVACY_RADIUS_VALUES = [250, 500, 1000, 5000] as const
export const LOCATION_PRIVACY_MIN_DISTANCE_VALUES = [
	50, 100, 250, 1000,
] as const
export const LOCATION_PRIVACY_DISTANCE_PRESETS = [
	{ min: 50, max: 250 },
	{ min: 100, max: 500 },
	{ min: 250, max: 1000 },
	{ min: 1000, max: 5000 },
] as const
export const LOCATION_PRIVACY_METHOD = 'stable-donut-displacement-v1' as const

export const MAP_ZOOM_LIMITS = {
	min: 1.5,
	max: 20,
	default: 10,
} as const

export type MapViewport = {
	latitude: number
	longitude: number
	zoom: number
}

const missingLocationValueToUndefined = (value: unknown) => {
	if (value === null || value === undefined) {
		return undefined
	}

	if (typeof value === 'string' && value.trim() === '') {
		return undefined
	}

	return value
}

export const locationSchema = z.object({
	latitude: z.preprocess(
		missingLocationValueToUndefined,
		z.coerce
			.number({
				error: (issue) =>
					issue.input === undefined
						? 'Latitude is required'
						: 'Latitude must be a valid number',
			})
			.min(
				LOCATION_LIMITS.latitude.min,
				`Latitude must be greater than or equal to ${LOCATION_LIMITS.latitude.min}`,
			)
			.max(
				LOCATION_LIMITS.latitude.max,
				`Latitude must be less than or equal to ${LOCATION_LIMITS.latitude.max}`,
			),
	),

	longitude: z.preprocess(
		missingLocationValueToUndefined,
		z.coerce
			.number({
				error: (issue) =>
					issue.input === undefined
						? 'Longitude is required'
						: 'Longitude must be a valid number',
			})
			.min(
				LOCATION_LIMITS.longitude.min,
				`Longitude must be greater than or equal to ${LOCATION_LIMITS.longitude.min}`,
			)
			.max(
				LOCATION_LIMITS.longitude.max,
				`Longitude must be less than or equal to ${LOCATION_LIMITS.longitude.max}`,
			),
	),
})

export const locationPrivacySchema = z
	.object({
		locationPrivacy: z.enum(LOCATION_PRIVACY_VALUES).default('exact'),
		locationPrivacyMinDistanceMeters: z.coerce
			.number()
			.refine(
				(
					value,
				): value is (typeof LOCATION_PRIVACY_MIN_DISTANCE_VALUES)[number] =>
					LOCATION_PRIVACY_MIN_DISTANCE_VALUES.includes(
						value as (typeof LOCATION_PRIVACY_MIN_DISTANCE_VALUES)[number],
					),
				'Location privacy minimum distance is invalid',
			)
			.default(100),
		locationPrivacyRadiusMeters: z.coerce
			.number()
			.refine(
				(value): value is (typeof LOCATION_PRIVACY_RADIUS_VALUES)[number] =>
					LOCATION_PRIVACY_RADIUS_VALUES.includes(
						value as (typeof LOCATION_PRIVACY_RADIUS_VALUES)[number],
					),
				'Location privacy radius is invalid',
			)
			.default(500),
	})
	.refine(
		(value) =>
			value.locationPrivacy === 'exact' ||
			value.locationPrivacyMinDistanceMeters <
				value.locationPrivacyRadiusMeters,
		{
			message:
				'Location privacy minimum distance must be smaller than the maximum radius',
			path: ['locationPrivacyMinDistanceMeters'],
		},
	)

export type LocationData = z.infer<typeof locationSchema>
export type LocationPrivacyData = z.infer<typeof locationPrivacySchema>

export function validLngLat(lng: number, lat: number): boolean {
	return locationSchema.safeParse({
		latitude: lat,
		longitude: lng,
	}).success
}

export function isValidMapZoom(value: unknown): value is number {
	return (
		typeof value === 'number' &&
		Number.isFinite(value) &&
		value >= MAP_ZOOM_LIMITS.min &&
		value <= MAP_ZOOM_LIMITS.max
	)
}

export function getValidMapViewport(value: {
	latitude: number | null | undefined
	longitude: number | null | undefined
	zoom?: number | null | undefined
}): MapViewport | null {
	const zoom = value.zoom ?? MAP_ZOOM_LIMITS.default

	if (!isValidLocation(value)) return null

	if (!isValidMapZoom(zoom)) return null

	return {
		latitude: value.latitude,
		longitude: value.longitude,
		zoom,
	}
}

export function isValidLocation(value: {
	latitude: number | null | undefined
	longitude: number | null | undefined
}): value is LocationData {
	return locationSchema.safeParse(value).success
}

export function parseLocationFormData(formData: FormData):
	| {
			success: true
			data: LocationData
	  }
	| {
			success: false
			errors: LocationFieldErrors
	  } {
	const parsed = locationSchema.safeParse({
		latitude: formData.get('latitude'),
		longitude: formData.get('longitude'),
	})

	if (parsed.success) {
		return {
			success: true,
			data: parsed.data,
		}
	}

	return {
		success: false,
		errors: getLocationFieldErrors(parsed.error),
	}
}

export function getLocationFieldErrors(error: z.ZodError<LocationData>) {
	const flattened = z.flattenError(error)

	return {
		latitude: flattened.fieldErrors.latitude?.[0],
		longitude: flattened.fieldErrors.longitude?.[0],
	}
}

export type LocationFieldErrors = {
	latitude?: string
	longitude?: string
	locationPrivacy?: string
	locationPrivacyMinDistanceMeters?: string
	locationPrivacyRadiusMeters?: string
}

export function validateLocationFieldErrors(
	value: unknown,
): LocationFieldErrors {
	const parsed = locationSchema.safeParse(value)

	if (parsed.success) {
		return {}
	}

	return getLocationFieldErrors(parsed.error)
}

export function parseLocationPrivacyFormData(formData: FormData):
	| {
			success: true
			data: LocationPrivacyData
	  }
	| {
			success: false
			errors: LocationFieldErrors
	  } {
	const parsed = locationPrivacySchema.safeParse({
		locationPrivacy: formData.get('locationPrivacy'),
		locationPrivacyMinDistanceMeters: formData.get(
			'locationPrivacyMinDistanceMeters',
		),
		locationPrivacyRadiusMeters: formData.get('locationPrivacyRadiusMeters'),
	})

	if (parsed.success) {
		return {
			success: true,
			data: parsed.data,
		}
	}

	const flattened = z.flattenError(parsed.error)

	return {
		success: false,
		errors: {
			locationPrivacy: flattened.fieldErrors.locationPrivacy?.[0],
			locationPrivacyMinDistanceMeters:
				flattened.fieldErrors.locationPrivacyMinDistanceMeters?.[0],
			locationPrivacyRadiusMeters:
				flattened.fieldErrors.locationPrivacyRadiusMeters?.[0],
		},
	}
}

export type OptionalMapViewportInput = {
	latitude: string
	longitude: string
	zoom: string
}

export function parseOptionalMapViewportInput(input: OptionalMapViewportInput):
	| {
			success: true
			data: {
				latitude: number | null
				longitude: number | null
				zoom: number | null
			}
	  }
	| {
			success: false
			message: string
	  } {
	const latitudeRaw = input.latitude.trim()
	const longitudeRaw = input.longitude.trim()
	const zoomRaw = input.zoom.trim()
	const hasLatitude = latitudeRaw.length > 0
	const hasLongitude = longitudeRaw.length > 0
	const zoom = zoomRaw.length > 0 ? Number(zoomRaw) : MAP_ZOOM_LIMITS.default

	if (hasLatitude !== hasLongitude) {
		return {
			success: false,
			message: 'Please provide both latitude and longitude.',
		}
	}

	if (!isValidMapZoom(zoom)) {
		return {
			success: false,
			message: `Zoom must be between ${MAP_ZOOM_LIMITS.min} and ${MAP_ZOOM_LIMITS.max}.`,
		}
	}

	if (!hasLatitude && !hasLongitude) {
		return {
			success: true,
			data: {
				latitude: null,
				longitude: null,
				zoom: null,
			},
		}
	}

	const parsedLocation = locationSchema.safeParse({
		latitude: latitudeRaw,
		longitude: longitudeRaw,
	})

	if (!parsedLocation.success) {
		const errors = getLocationFieldErrors(parsedLocation.error)

		return {
			success: false,
			message:
				errors.latitude ??
				errors.longitude ??
				'Please provide a valid latitude and longitude.',
		}
	}

	return {
		success: true,
		data: {
			latitude: parsedLocation.data.latitude,
			longitude: parsedLocation.data.longitude,
			zoom,
		},
	}
}

export function isOptionalMapViewInputValid(input: OptionalMapViewportInput) {
	return parseOptionalMapViewportInput(input).success
}
