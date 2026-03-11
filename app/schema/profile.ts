import { createId } from '@paralleldrive/cuid2'
import {
	relations,
	type InferInsertModel,
	type InferSelectModel,
} from 'drizzle-orm'
import { pgTable, boolean, text } from 'drizzle-orm/pg-core'
import { profileImage } from './profile-image'
import { user } from './user'

/**
 * Table
 */
export const profile = pgTable('profile', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	username: text('username').unique().notNull(),
	public: boolean('public').default(false),
	userId: text('user_id').references(() => user.id, {
		onDelete: 'cascade',
		onUpdate: 'cascade',
	}),
})

/**
 * Relations
 */
export const profileRelations = relations(profile, ({ one }) => ({
	user: one(user, {
		fields: [profile.userId],
		references: [user.id],
	}),
	profileImage: one(profileImage, {
		fields: [profile.id],
		references: [profileImage.profileId],
	}),
}))

/**
 * Types
 */
export type Profile = InferSelectModel<typeof profile>
export type InsertProfile = InferInsertModel<typeof profile>
