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
export const LOCATION_PRIVACY_METHOD = 'deterministic-jitter-v1' as const

const emptyStringToUndefined = (value: unknown) => {
	if (typeof value === 'string' && value.trim() === '') {
		return undefined
	}

	return value
}

export const locationSchema = z.object({
	latitude: z.preprocess(
		emptyStringToUndefined,
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
		emptyStringToUndefined,
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

export const locationPrivacySchema = z.object({
	locationPrivacy: z.enum(LOCATION_PRIVACY_VALUES).default('exact'),
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

export type LocationData = z.infer<typeof locationSchema>
export type LocationPrivacyData = z.infer<typeof locationPrivacySchema>

export function validLngLat(lng: number, lat: number): boolean {
	return locationSchema.safeParse({
		latitude: lat,
		longitude: lng,
	}).success
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
			locationPrivacyRadiusMeters:
				flattened.fieldErrors.locationPrivacyRadiusMeters?.[0],
		},
	}
}
