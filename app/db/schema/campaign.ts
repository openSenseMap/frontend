import { createId } from '@paralleldrive/cuid2'
import {
	type InferInsertModel,
	type InferSelectModel,
	relations,
	sql,
} from 'drizzle-orm'
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
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

export const campaignBookmark = pgTable(
	'campaign_bookmark',
	{
		id: text('id')
			.primaryKey()
			.notNull()
			.$defaultFn(() => createId()),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaign.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [
		index('campaign_bookmark_campaign_id_idx').on(table.campaignId),
		index('campaign_bookmark_user_id_idx').on(table.userId),
		unique('campaign_bookmark_user_campaign_unique').on(
			table.userId,
			table.campaignId,
		),
	],
)

export const campaignRelations = relations(campaign, ({ many, one }) => ({
	owner: one(user, {
		fields: [campaign.ownerId],
		references: [user.id],
	}),
	bookmarks: many(campaignBookmark),
}))

export const campaignBookmarkRelations = relations(
	campaignBookmark,
	({ one }) => ({
		campaign: one(campaign, {
			fields: [campaignBookmark.campaignId],
			references: [campaign.id],
		}),
		user: one(user, {
			fields: [campaignBookmark.userId],
			references: [user.id],
		}),
	}),
)

export type Campaign = InferSelectModel<typeof campaign>
export type InsertCampaign = InferInsertModel<typeof campaign>
export type CampaignBookmark = InferSelectModel<typeof campaignBookmark>
export type InsertCampaignBookmark = InferInsertModel<typeof campaignBookmark>
