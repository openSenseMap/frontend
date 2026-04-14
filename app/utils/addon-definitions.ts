export const addonDefinitions: Record<
	string,
	{ title: string; unit: string; sensorType: string; icon?: string }[]
> = {
	feinstaub: [
		{
			title: 'PM10',
			unit: 'µg/m³',
			sensorType: 'SDS 011',
			icon: 'particulate_matter',
		},
		{
			title: 'PM2.5',
			unit: 'µg/m³',
			sensorType: 'SDS 011',
			icon: 'particulate_matter',
		},
	],
}
