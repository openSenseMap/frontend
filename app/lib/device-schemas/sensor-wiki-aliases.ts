export type SensorWikiAliasInput = {
	title?: string | null
	unit?: string | null
	sensorType?: string | null
}

export type SensorWikiAliasMatch = {
	sensorWikiPhenomenon: string
	sensorWikiUnit?: string
	confidence: 'high' | 'medium'
	source: 'curated-alias'
	reasons: string[]
}

export type SensorWikiAliasSuggestion = SensorWikiAliasMatch & {
	title: string
	unit?: string
	aliases: string[]
}

export type SensorWikiAliasEntry = {
	sensorWikiPhenomenon: string
	sensorWikiUnit?: string
	title: string
	unit?: string
	titleAliases: string[]
	unitAliases?: string[]
	sensorTypeAliases?: string[]
}

export const sensorWikiAliasEntries: SensorWikiAliasEntry[] = [
	{
		sensorWikiPhenomenon: 'temperature',
		sensorWikiUnit: 'Cel',
		title: 'Temperature',
		unit: '°C',
		titleAliases: [
			'air temperature',
			'lufttemperatur',
			'temperatur',
			'temperature',
			'temp',
		],
		unitAliases: ['c', 'cel', 'celsius', 'degc', 'degree celsius', '°c'],
	},
	{
		sensorWikiPhenomenon: 'relative_humidity',
		sensorWikiUnit: '%',
		title: 'Relative humidity',
		unit: '%',
		titleAliases: [
			'humidity',
			'luftfeuchte',
			'luftfeuchtigkeit',
			'rel luftfeuchte',
			'rel. luftfeuchte',
			'relative humidity',
		],
		unitAliases: ['%', '%rh', 'percent', 'rh'],
	},
	{
		sensorWikiPhenomenon: 'barometric_pressure',
		sensorWikiUnit: 'hPa',
		title: 'Barometric pressure',
		unit: 'hPa',
		titleAliases: [
			'air pressure',
			'atm luftdruck',
			'atm. luftdruck',
			'barometric pressure',
			'luftdruck',
			'pressure',
		],
		unitAliases: ['hpa', 'mbar'],
	},
	{
		sensorWikiPhenomenon: 'barometric_pressure',
		sensorWikiUnit: 'Pa',
		title: 'Barometric pressure',
		unit: 'Pa',
		titleAliases: [
			'air pressure',
			'atm luftdruck',
			'atm. luftdruck',
			'barometric pressure',
			'luftdruck',
			'pressure',
		],
		unitAliases: ['pa'],
	},
	{
		sensorWikiPhenomenon: 'pm10',
		sensorWikiUnit: 'ug/m3',
		title: 'PM10',
		unit: 'µg/m³',
		titleAliases: ['particle 10', 'particulate matter 10', 'pm 10', 'pm10'],
		unitAliases: ['ug/m3', 'µg/m³', 'μg/m³'],
	},
	{
		sensorWikiPhenomenon: 'pm25',
		sensorWikiUnit: 'ug/m3',
		title: 'PM2.5',
		unit: 'µg/m³',
		titleAliases: [
			'particle 2 5',
			'particle 2,5',
			'particulate matter 2 5',
			'particulate matter 2.5',
			'pm 2 5',
			'pm 2.5',
			'pm2 5',
			'pm2.5',
			'pm25',
		],
		unitAliases: ['ug/m3', 'µg/m³', 'μg/m³'],
	},
	{
		sensorWikiPhenomenon: 'ambient_light',
		sensorWikiUnit: 'lx',
		title: 'Ambient light',
		unit: 'lx',
		titleAliases: [
			'ambient light',
			'beleuchtungsstarke',
			'beleuchtungsstärke',
			'helligkeit',
			'light',
		],
		unitAliases: ['lux', 'lx'],
	},
	{
		sensorWikiPhenomenon: 'ultraviolet_a_light',
		sensorWikiUnit: 'uW/cm2',
		title: 'UV intensity',
		unit: 'µW/cm²',
		titleAliases: ['uv intensitat', 'uv intensität', 'uv intensity'],
		unitAliases: ['uw/cm2', 'uw/cm²', 'µw/cm2', 'µw/cm²', 'μw/cm2', 'μw/cm²'],
	},
	{
		sensorWikiPhenomenon: 'soil_moisture',
		sensorWikiUnit: '%',
		title: 'Soil moisture',
		unit: '%',
		titleAliases: ['bodenfeuchte', 'soil moisture'],
		unitAliases: ['%', 'percent'],
	},
]

export function normalizeSensorWikiAliasValue(value?: string | null) {
	return (value ?? '')
		.trim()
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/µ/g, 'u')
		.replace(/μ/g, 'u')
		.replace(/³/g, '3')
		.replace(/²/g, '2')
		.replace(/°/g, '')
		.replace(/[^a-z0-9%/]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

export function matchSensorWikiAlias(
	input: SensorWikiAliasInput,
): SensorWikiAliasMatch | undefined {
	const normalizedTitle = normalizeSensorWikiAliasValue(input.title)
	const normalizedUnit = normalizeSensorWikiAliasValue(input.unit)
	const normalizedSensorType = normalizeSensorWikiAliasValue(input.sensorType)

	for (const entry of sensorWikiAliasEntries) {
		const titleMatched = entry.titleAliases.some(
			(alias) => normalizeSensorWikiAliasValue(alias) === normalizedTitle,
		)
		const unitMatched =
			!!normalizedUnit &&
			entry.unitAliases?.some(
				(alias) => normalizeSensorWikiAliasValue(alias) === normalizedUnit,
			)
		const sensorTypeMatched =
			!!normalizedSensorType &&
			entry.sensorTypeAliases?.some(
				(alias) =>
					normalizeSensorWikiAliasValue(alias) === normalizedSensorType,
			)

		if (!titleMatched) continue

		const reasons = ['title-alias']
		if (unitMatched) reasons.push('unit-alias')
		if (sensorTypeMatched) reasons.push('sensor-type-alias')

		return {
			sensorWikiPhenomenon: entry.sensorWikiPhenomenon,
			sensorWikiUnit: unitMatched ? entry.sensorWikiUnit : undefined,
			confidence: unitMatched || sensorTypeMatched ? 'high' : 'medium',
			source: 'curated-alias',
			reasons,
		}
	}

	return undefined
}

export function getSensorWikiAliasSuggestions(
	input: SensorWikiAliasInput,
	limit = 5,
): SensorWikiAliasSuggestion[] {
	const normalizedTitle = normalizeSensorWikiAliasValue(input.title)
	const normalizedUnit = normalizeSensorWikiAliasValue(input.unit)
	const normalizedSensorType = normalizeSensorWikiAliasValue(input.sensorType)

	if (normalizedTitle.length < 2) return []

	return sensorWikiAliasEntries
		.map((entry) => {
			const normalizedAliases = [entry.title, ...entry.titleAliases].map(
				(alias) => normalizeSensorWikiAliasValue(alias),
			)
			const titleMatches = normalizedAliases.some((alias) =>
				alias.includes(normalizedTitle),
			)
			const titleStartsWithQuery = normalizedAliases.some((alias) =>
				alias.startsWith(normalizedTitle),
			)
			const unitMatched =
				!!normalizedUnit &&
				entry.unitAliases?.some(
					(alias) => normalizeSensorWikiAliasValue(alias) === normalizedUnit,
				)
			const sensorTypeMatched =
				!!normalizedSensorType &&
				entry.sensorTypeAliases?.some(
					(alias) =>
						normalizeSensorWikiAliasValue(alias) === normalizedSensorType,
				)

			if (!titleMatches) return null

			const reasons = ['title-alias']
			if (unitMatched) reasons.push('unit-alias')
			if (sensorTypeMatched) reasons.push('sensor-type-alias')

			return {
				suggestion: {
					title: entry.title,
					unit: entry.unit,
					sensorWikiPhenomenon: entry.sensorWikiPhenomenon,
					sensorWikiUnit: entry.sensorWikiUnit,
					confidence: unitMatched || sensorTypeMatched ? 'high' : 'medium',
					source: 'curated-alias',
					reasons,
					aliases: entry.titleAliases,
				} satisfies SensorWikiAliasSuggestion,
				score:
					(titleStartsWithQuery ? 2 : 1) +
					(unitMatched ? 2 : 0) +
					(sensorTypeMatched ? 1 : 0),
			}
		})
		.filter((result): result is NonNullable<typeof result> => result !== null)
		.sort((a, b) => b.score - a.score)
		.map(({ suggestion }) => suggestion)
		.slice(0, limit)
}
