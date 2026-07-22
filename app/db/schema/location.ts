import { sql } from 'drizzle-orm'
import {
	bigserial,
	geometry,
	index,
	pgTable,
	unique,
} from 'drizzle-orm/pg-core'

/**
 * Table
 */
export const location = pgTable(
	'location',
	{
		id: bigserial('id', { mode: 'bigint' }).primaryKey(),
		location: geometry('location', {
			type: 'point',
			mode: 'xy',
			srid: 4326,
		}).notNull(),
	},
	(t) => [
		index('location_index').using('gist', t.location),
		unique().on(t.location),
		sql`CONSTRAINT check_location CHECK (
			ST_X(${t.location}) BETWEEN -180 AND 180
			ST_Y(${t.location}) BETWEEN -90 AND 90
		)`,
	],
)
