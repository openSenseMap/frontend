import { sql } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'

type TagsRow = {
	tags: string[]
}

/**
 * Queries the database for a distinct list of all tags known to the
 * application across all registered devices.
 * @returns An array containing the names of the tags or an empty array if there are none
 */
export const getTags = async function findTags(): Promise<string[]> {
	const result = await drizzleClient.execute<TagsRow>(
		sql`
			SELECT COALESCE(array_agg(DISTINCT u.val ORDER BY u.val), ARRAY[]::text[]) AS tags
			FROM device d
			CROSS JOIN LATERAL unnest(d.tags) AS u(val);
		`,
	)

	return result[0]?.tags ?? []
}
