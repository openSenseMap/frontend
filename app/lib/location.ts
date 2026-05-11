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

export type LocationData = z.infer<typeof locationSchema>

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

export function parseLocationFormData(formData: FormData) {
	return locationSchema.safeParse({
		latitude: formData.get('latitude'),
		longitude: formData.get('longitude'),
	})
}

export function getLocationFieldErrors(error: z.ZodError<LocationData>) {
	const flattened = z.flattenError(error)

	return {
		latitude: flattened.fieldErrors.latitude?.[0],
		longitude: flattened.fieldErrors.longitude?.[0],
	}
}
