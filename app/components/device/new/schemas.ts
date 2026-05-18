import { z } from 'zod'
import { DeviceModelEnum } from '~/db/schema/enum'
import { sensorSchema } from './sensors-info'
import { StepId } from './stepper.config'

export const generalInfoSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters')
		.min(1, 'Name is required'),
	description: z
		.string()
		.max(5000, 'Description should not exceed 5000 characters')
		.optional()
		.nullable(),
	exposure: z.enum(['indoor', 'outdoor', 'mobile', 'unknown'], {
		error: () => 'Exposure is required',
	}),
	temporaryExpirationDate: z
		.string()
		.optional()
		.transform((date) => (date ? new Date(date) : undefined)) // Transform string to Date
		.refine(
			(date) =>
				!date || date <= new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
			{
				message: 'Temporary expiration date must be within 1 month from now',
			},
		),
	tags: z
		.array(
			z.object({
				value: z.string(),
			}),
		)
		.optional(),
})

export const locationSchema = z.object({
	latitude: z.coerce
		.number({
			error: (issue) =>
				issue.input === undefined
					? 'Latitude is required'
					: 'Latitude must be a valid number',
		})
		.min(-90, 'Latitude must be greater than or equal to -90')
		.max(90, 'Latitude must be less than or equal to 90'),
	longitude: z.coerce
		.number({
			error: (issue) =>
				issue.input === undefined
					? 'Longitude is required'
					: 'Longitude must be a valid number',
		})
		.min(-180, 'Longitude must be greater than or equal to -180')
		.max(180, 'Longitude must be less than or equal to 180'),
})

export const deviceSchema = z.object({
	model: z.enum(DeviceModelEnum.enumValues, {
		error: () => 'Please select a device.',
	}),
})

// selectedSensors can be an array of sensors
export const sensorsSchema = z.object({
	selectedSensors: z
		.array(sensorSchema)
		.min(1, 'Please select at least one sensor'),
})

export const advancedSchema = z.record(z.string(), z.any())

export const formSchema = z.union([
	generalInfoSchema,
	locationSchema,
	deviceSchema,
	sensorsSchema,
	advancedSchema,
])

export const stepSchemas = {
	'general-info': generalInfoSchema,
	location: locationSchema,
	'device-selection': deviceSchema,
	'sensor-selection': sensorsSchema,
	advanced: advancedSchema,
	summary: z.object({}),
} satisfies Record<StepId, z.ZodTypeAny>

export type GeneralInfoData = z.infer<typeof generalInfoSchema>
export type LocationData = z.infer<typeof locationSchema>
export type DeviceData = z.infer<typeof deviceSchema>
export type SensorData = z.infer<typeof sensorsSchema>
export type AdvancedData = z.infer<typeof advancedSchema>

export type FormData =
	| GeneralInfoData
	| LocationData
	| DeviceData
	| SensorData
	| AdvancedData
