export type CampaignTemplateCategory =
	| 'climate'
	| 'air_quality'
	| 'education'
	| 'water'

export type CampaignTemplate = {
	id: string
	category: CampaignTemplateCategory
	titleKey: string
	summaryKey: string
	descriptionKey: string
	requirementsKey: string
	phenomena: string[]
	gridSize: number
	minDevicesPerCell: number
	minMeasurementsPerCell: number
	suggestedDurationDays?: number
}

export type CampaignTemplateDefaults = {
	id: string
	title: string
	summary: string
	description: string
	requirements: string
	phenomena: string[]
	gridSize: number
	minDevicesPerCell: number
	minMeasurementsPerCell: number
	suggestedDurationDays?: number | null
}

export const campaignTemplates = [
	{
		id: 'urban-heat',
		category: 'climate',
		titleKey: 'template_urban_heat_title',
		summaryKey: 'template_urban_heat_summary',
		descriptionKey: 'template_urban_heat_description',
		requirementsKey: 'template_urban_heat_requirements',
		phenomena: ['temperature', 'humidity'],
		gridSize: 8,
		minDevicesPerCell: 1,
		minMeasurementsPerCell: 24,
		suggestedDurationDays: 14,
	},
	{
		id: 'air-quality-snapshot',
		category: 'air_quality',
		titleKey: 'template_air_quality_title',
		summaryKey: 'template_air_quality_summary',
		descriptionKey: 'template_air_quality_description',
		requirementsKey: 'template_air_quality_requirements',
		phenomena: ['PM10', 'PM2.5'],
		gridSize: 6,
		minDevicesPerCell: 1,
		minMeasurementsPerCell: 12,
		suggestedDurationDays: 7,
	},
	{
		id: 'school-weather-week',
		category: 'education',
		titleKey: 'template_school_weather_title',
		summaryKey: 'template_school_weather_summary',
		descriptionKey: 'template_school_weather_description',
		requirementsKey: 'template_school_weather_requirements',
		phenomena: ['temperature', 'humidity', 'pressure'],
		gridSize: 4,
		minDevicesPerCell: 1,
		minMeasurementsPerCell: 20,
		suggestedDurationDays: 5,
	},
	{
		id: 'water-temperature-watch',
		category: 'water',
		titleKey: 'template_water_temperature_title',
		summaryKey: 'template_water_temperature_summary',
		descriptionKey: 'template_water_temperature_description',
		requirementsKey: 'template_water_temperature_requirements',
		phenomena: ['water temperature'],
		gridSize: 5,
		minDevicesPerCell: 1,
		minMeasurementsPerCell: 10,
		suggestedDurationDays: 21,
	},
] satisfies CampaignTemplate[]

export function getCampaignTemplate(templateId: string | null) {
	if (!templateId) return undefined
	return campaignTemplates.find((template) => template.id === templateId)
}

export function getUserTemplateId(templateId: string | null) {
	if (!templateId?.startsWith('user:')) return undefined
	return templateId.slice('user:'.length)
}
