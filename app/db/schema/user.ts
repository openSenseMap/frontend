import { createId } from '@paralleldrive/cuid2'
import {
	type InferInsertModel,
	type InferSelectModel,
	relations,
} from 'drizzle-orm'
import { pgTable, boolean, text, timestamp } from 'drizzle-orm/pg-core'
import { v4 as uuidv4 } from 'uuid'
import { actionToken } from './action-token'
import { campaign } from './campaign'
import { device } from './device'
import { password } from './password'
import { profile } from './profile'
import { refreshToken } from './refreshToken'
import { tosVersion } from './tos'

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
	role: text('role').$type<'admin' | 'user'>().default('user'),
	language: text('language').default('en_US'),
	emailIsConfirmed: boolean('email_is_confirmed').default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	acceptedTosVersionId: text('accepted_tos_version_id').references(
		() => tosVersion.id,
	),
	acceptedTosAt: timestamp('accepted_tos_at', { withTimezone: true }),
})

/**
 * Relations
 */
export const userRelations = relations(user, ({ one, many }) => ({
	password: one(password, {
		fields: [user.id],
		references: [password.userId],
	}),
	profile: one(profile, {
		fields: [user.id],
		references: [profile.userId],
	}),
	devices: many(device),
	campaigns: many(campaign),
	refreshToken: many(refreshToken),
	actionTokens: many(actionToken),
}))

/**
 * Types
 */
export type User = InferSelectModel<typeof user>
export type InsertUser = InferInsertModel<typeof user>
