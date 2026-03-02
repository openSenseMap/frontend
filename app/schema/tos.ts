import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { user } from './user'

export const tosVersion = pgTable(
  'tos_version',
  {
    id: text('id').primaryKey().notNull().$defaultFn(() => createId()),

    version: text('version').notNull().unique(),

    title: text('title').notNull(),
    body: text('body').notNull(),

    effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    effectiveAtIdx: index('tos_version_effective_at_idx').on(t.effectiveAt),
  }),
)

export const tosAcceptance = pgTable(
  'tos_acceptance',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    tosVersionId: text('tos_version_id')
      .notNull()
      .references(() => tosVersion.id, { onDelete: 'cascade' }),

    acceptedAt: timestamp('accepted_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.tosVersionId] }),
    userIdx: index('tos_acceptance_user_idx').on(t.userId),
  }),
)