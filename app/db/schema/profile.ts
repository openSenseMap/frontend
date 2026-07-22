import { createId } from '@paralleldrive/cuid2'
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm'
import {
	pgTable,
	boolean,
	doublePrecision,
	real,
	text,
} from 'drizzle-orm/pg-core'
import { user } from './user'

/**
 * Table
 */
export const profile = pgTable('profile', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	displayName: text('display_name').notNull(),
	public: boolean('public').default(false),
	homeLatitude: doublePrecision('home_latitude'),
	homeLongitude: doublePrecision('home_longitude'),
	homeZoom: real('home_zoom').default(10),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, {
			onDelete: 'cascade',
			onUpdate: 'cascade',
		}),
})

/**
 * Types
 */
export type Profile = InferSelectModel<typeof profile>
export type InsertProfile = InferInsertModel<typeof profile>
