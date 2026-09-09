import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export type RateLimitGrantKind =
	| 'user_email'
	| 'email_domain'
	| 'credential_hash'
export type RateLimitTier = 'standard_plus' | 'trusted' | 'high_volume'

export const rateLimitGrant = pgTable('rate_limit_grant', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	kind: text('kind').$type<RateLimitGrantKind>().notNull(),
	value: text('value').notNull(),
	tier: text('tier').$type<RateLimitTier>().notNull(),
	enabled: boolean('enabled').default(true).notNull(),
	note: text('note'),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export type RateLimitGrant = typeof rateLimitGrant.$inferSelect
export type InsertRateLimitGrant = typeof rateLimitGrant.$inferInsert
