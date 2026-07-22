import { createId } from '@paralleldrive/cuid2'
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm'
import { pgTable, boolean, text, timestamp } from 'drizzle-orm/pg-core'
import { tosVersion } from './tos'
import { themePreference } from './enum'

/**
 * Table
 */
export const user = pgTable('user', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	name: text('name').notNull().unique(),
	email: text('email').unique().notNull(),
	unconfirmedEmail: text('unconfirmed_email').unique(),
	themePreference: themePreference('theme_preference')
		.default('system')
		.notNull(),
	role: text('role').$type<'admin' | 'user'>().default('user'),
	language: text('language').default('en_US'),
	emailIsConfirmed: boolean('email_is_confirmed').default(false),
	newsletterOptIn: boolean('newsletter_opt_in').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	acceptedTosVersionId: text('accepted_tos_version_id').references(
		() => tosVersion.id,
	),
	acceptedTosAt: timestamp('accepted_tos_at', { withTimezone: true }),
})

/**
 * Types
 */
export type User = InferSelectModel<typeof user>
export type InsertUser = InferInsertModel<typeof user>
