import { createId } from '@paralleldrive/cuid2'
import {
	type InferInsertModel,
	type InferSelectModel,
	relations,
} from 'drizzle-orm'
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './user'

export const elevationConsent = pgTable(
	'elevation_consent',
	{
		id: text('id')
			.primaryKey()
			.notNull()
			.$defaultFn(() => createId()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
		processor: text('processor').$type<'opentopodata'>().notNull(),
		consentVersion: text('consent_version').notNull(),
		acceptedAt: timestamp('accepted_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
	},
	(t) => ({
		userProcessorIdx: index('elevation_consent_user_processor_idx').on(
			t.userId,
			t.processor,
		),
	}),
)

export const elevationConsentRelations = relations(
	elevationConsent,
	({ one }) => ({
		user: one(user, {
			fields: [elevationConsent.userId],
			references: [user.id],
		}),
	}),
)

export type ElevationConsent = InferSelectModel<typeof elevationConsent>
export type InsertElevationConsent = InferInsertModel<typeof elevationConsent>
