import { sql } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'

/**
 * Queries the database for a distinct list of all tags known to the
 * application across all registered devices.
 * @returns An array containing the names of the tags or an empty array if there are none
 */
export const getTags = async function findTags() {
	const tags = await drizzleClient.execute(
		sql`SELECT array_agg(DISTINCT u.val) tags FROM device d CROSS JOIN LATERAL unnest(d.tags) AS u(val);`,
	)
	return tags[0]?.tags ?? []
}
