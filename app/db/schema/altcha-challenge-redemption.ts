import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Records accepted ALTCHA challenges so a solved proof cannot be replayed.
 * Rows only need to live until the corresponding challenge expires.
 */
export const altchaChallengeRedemption = pgTable(
	'altcha_challenge_redemption',
	{
		signature: text('signature').primaryKey().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		redeemedAt: timestamp('redeemed_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('altcha_challenge_redemption_expires_at_idx').on(table.expiresAt),
	],
)
