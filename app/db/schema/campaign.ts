import { createId } from '@paralleldrive/cuid2'
import {
	type InferInsertModel,
	type InferSelectModel,
	relations,
	sql,
} from 'drizzle-orm'
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'
import { user } from './user'

export const campaign = pgTable('campaign', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	requirements: text('requirements').notNull(),
	phenomena: text('phenomena')
		.array()
		.notNull()
		.default(sql`ARRAY[]::text[]`),
	gridSize: integer('grid_size').default(6).notNull(),
	minDevicesPerCell: integer('min_devices_per_cell').default(1).notNull(),
	minMeasurementsPerCell: integer('min_measurements_per_cell')
		.default(1)
		.notNull(),
	area: jsonb('area').notNull(),
	centerpoint: jsonb('centerpoint').notNull(),
	public: boolean('public').default(true).notNull(),
	startDate: timestamp('start_date'),
	endDate: timestamp('end_date'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	ownerId: text('owner_id')
		.notNull()
		.references(() => user.id, {
			onDelete: 'cascade',
			onUpdate: 'cascade',
		}),
})

export const campaignRelations = relations(campaign, ({ one }) => ({
	owner: one(user, {
		fields: [campaign.ownerId],
		references: [user.id],
	}),
}))

export type Campaign = InferSelectModel<typeof campaign>
export type InsertCampaign = InferInsertModel<typeof campaign>
