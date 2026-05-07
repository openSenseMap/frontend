import { sql } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { type SensorWikiTranslation } from '~/lib/sensor-wiki'

export type Phenomenon = {
	id: number
	slug: string
	markdown: SensorWikiTranslation
	label: SensorWikiTranslation
	description: SensorWikiTranslation
}

// export async function getPhenomena() {
// 	const response = await fetch('https://api.sensors.wiki/phenomena')
// 	const jsonData = await response.json()
// 	return jsonData
// }

type PhenomenaRow = {
	phenomena: string[]
}

/**
 * Queries the database for a distinct list of all sensor titles / phenomena
 * known to the application across all non-archived devices.
 */
export const getPhenomena = async function findPhenomena(): Promise<string[]> {
	const result = await drizzleClient.execute<PhenomenaRow>(
		sql`
			SELECT COALESCE(
				array_agg(DISTINCT s.title ORDER BY s.title),
				ARRAY[]::text[]
			) AS phenomena
			FROM sensor s
			INNER JOIN device d ON s.device_id = d.id
			WHERE d.archived_at IS NULL
				AND s.title IS NOT NULL
				AND s.title <> '';
		`,
	)

	return result[0]?.phenomena ?? []
}
