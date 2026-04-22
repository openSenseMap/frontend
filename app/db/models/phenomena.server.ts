import { type SensorWikiTranslation } from '~/lib/sensor-wiki'

export type Phenomenon = {
	id: number
	slug: string
	markdown: SensorWikiTranslation
	label: SensorWikiTranslation
	description: SensorWikiTranslation
}

export async function getPhenomena() {
	const response = await fetch('https://api.sensors.wiki/phenomena')
	const jsonData = await response.json()
	return jsonData
}
