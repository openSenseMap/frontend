import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp, primaryKey, index, integer } from 'drizzle-orm/pg-core'
import { user } from './user'

export const tosVersion = pgTable(
  'tos_version',
  {
    id: text('id').primaryKey().notNull().$defaultFn(() => createId()),

    version: text('version').notNull().unique(),

    title: text('title').notNull(),
    body: text('body').notNull(),

    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    graceDays: integer('grace_days').notNull().default(7),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    effectiveFromIdx: index('tos_version_effective_from_idx').on(t.effectiveFrom),
  }),
)

export const tosUserState = pgTable(
  'tos_user_state',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    tosVersionId: text('tos_version_id')
      .notNull()
      .references(() => tosVersion.id, { onDelete: 'cascade' }),

    firstSeenAt: timestamp('first_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    graceUntil: timestamp('grace_until', { withTimezone: true }).notNull(),

    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.tosVersionId] }),
    userIdx: index('tos_user_state_user_idx').on(t.userId),
    graceIdx: index('tos_user_state_grace_until_idx').on(t.graceUntil),
  }),
)