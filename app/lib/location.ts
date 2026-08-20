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

export const locationCoordinatesSchema = z.object({
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

export type LocationCoordinates = z.infer<typeof locationCoordinatesSchema>

export const deviceLocationInputSchema = locationCoordinatesSchema.extend({
	heightAboveGround: z.preprocess(
		missingLocationValueToUndefined,
		z.coerce
			.number({
				error: 'Height above ground must be a valid number',
			})
			.finite('Height above ground must be a finite number')
			.optional(),
	),
})

export type DeviceLocationInput = z.infer<typeof deviceLocationInputSchema>

export type DeviceLocationInputFieldErrors = {
	latitude?: string
	longitude?: string
	heightAboveGround?: string
	elevation?: string
}

export function parseDeviceLocationInputFormData(formData: FormData):
	| {
			success: true
			data: DeviceLocationInput
	  }
	| {
			success: false
			errors: DeviceLocationInputFieldErrors
	  } {
	const parsed = deviceLocationInputSchema.safeParse({
		latitude: formData.get('latitude'),
		longitude: formData.get('longitude'),
		heightAboveGround: formData.get('heightAboveGround'),
	})

	if (parsed.success) return { success: true, data: parsed.data }

	const flattened = z.flattenError(parsed.error)

	return {
		success: false,
		errors: {
			latitude: flattened.fieldErrors.latitude?.[0],
			longitude: flattened.fieldErrors.longitude?.[0],
			heightAboveGround: flattened.fieldErrors.heightAboveGround?.[0],
		},
	}
}

export function validateDeviceLocationInputFieldErrors(
	value: unknown,
): DeviceLocationInputFieldErrors {
	const parsed = deviceLocationInputSchema.safeParse(value)

	if (parsed.success) return {}

	const flattened = z.flattenError(parsed.error)

	return {
		latitude: flattened.fieldErrors.latitude?.[0],
		longitude: flattened.fieldErrors.longitude?.[0],
		heightAboveGround: flattened.fieldErrors.heightAboveGround?.[0],
	}
}

export function validLngLat(lng: number, lat: number): boolean {
	return locationCoordinatesSchema.safeParse({
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
}): value is LocationCoordinates {
	return locationCoordinatesSchema.safeParse(value).success
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

	const parsedLocation = locationCoordinatesSchema.safeParse({
		latitude: latitudeRaw,
		longitude: longitudeRaw,
	})

	if (!parsedLocation.success) {
		const flattened = z.flattenError(parsedLocation.error)

		return {
			success: false,
			message:
				flattened.fieldErrors.latitude?.[0] ??
				flattened.fieldErrors.longitude?.[0] ??
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

export function toGeoJsonPosition(
	longitude: number,
	latitude: number,
	height: number | null | undefined,
): [number, number] | [number, number, number] {
	return height == null ? [longitude, latitude] : [longitude, latitude, height]
}
