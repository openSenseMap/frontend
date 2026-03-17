import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { user } from './user'

export const actionToken = pgTable(
  'action_token',
  {
    id: text('id').primaryKey().notNull().$defaultFn(() => createId()),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    purpose: text('purpose')
      .$type<'email_confirmation' | 'password_reset' | 'tos_acceptance'>()
      .notNull(),

    tokenHash: text('token_hash').notNull().unique(),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (t) => ({
    userPurposeIdx: index('action_token_user_purpose_idx').on(t.userId, t.purpose),
    expiresAtIdx: index('action_token_expires_at_idx').on(t.expiresAt),
  }),
)