import { createId } from '@paralleldrive/cuid2'
import {
	type InferInsertModel,
	type InferSelectModel,
	relations,
} from 'drizzle-orm'
import { pgTable, boolean, text, timestamp } from 'drizzle-orm/pg-core'
import { v4 as uuidv4 } from 'uuid'
import { device } from './device'
import { password, passwordResetRequest } from './password'
import { profile } from './profile'
import { refreshToken } from './refreshToken'

/**
 * Table
 */
export const user = pgTable('user', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	name: text('name').notNull(),
	email: text('email').unique().notNull(),
	unconfirmedEmail: text('unconfirmed_email').unique(),
	role: text('role').$type<'admin' | 'user'>().default('user'),
	language: text('language').default('en_US'),
	emailIsConfirmed: boolean('email_is_confirmed').default(false),
	emailConfirmationToken: text('email_confirmation_token').$defaultFn(() =>
		uuidv4(),
	),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
	refreshToken: many(refreshToken),
	passwordResetRequest: one(passwordResetRequest, {
		fields: [user.id],
		references: [passwordResetRequest.userId],
	}),
}))

/**
 * Types
 */
export type User = InferSelectModel<typeof user>
export type InsertUser = InferInsertModel<typeof user>
