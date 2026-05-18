import { defineStepper } from '@stepperize/react'
import {
	advancedSchema,
	deviceSchema,
	generalInfoSchema,
	locationSchema,
	sensorsSchema,
} from './schemas'
import { z } from 'zod'

export const Stepper = defineStepper(
	{
		id: 'general-info',
		label: 'general_info',
		infoKey: 'general_information_text',
		schema: generalInfoSchema,
		index: 0,
	},
	{
		id: 'location',
		label: 'location',
		infoKey: 'location_info_text',
		schema: locationSchema,
		index: 1,
	},
	{
		id: 'device-selection',
		label: 'device_selection',
		infoKey: 'device_selection_info_text',
		schema: deviceSchema,
		index: 2,
	},
	{
		id: 'sensor-selection',
		label: 'sensor_selection',
		infoKey: 'sensor_selection_info_text',
		schema: sensorsSchema,
		index: 3,
	},
	{
		id: 'advanced',
		label: 'advanced',
		infoKey: null,
		schema: advancedSchema,
		index: 4,
	},
	{
		id: 'summary',
		label: 'summary',
		infoKey: null,
		schema: z.object({}),
		index: 5,
	},
)

export type StepId = (typeof Stepper.steps)[number]['id']
