import { lt } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { altchaChallengeRedemption } from '~/db/schema'

/**
 * Atomically marks a challenge as used. The primary key makes concurrent or
 * later replays return false, including when the app runs on multiple nodes.
 */
export async function redeemAltchaChallenge(
	signature: string,
	expiresAt: Date,
): Promise<boolean> {
	return drizzleClient.transaction(async (transaction) => {
		await transaction
			.delete(altchaChallengeRedemption)
			.where(lt(altchaChallengeRedemption.expiresAt, new Date()))

		const [redemption] = await transaction
			.insert(altchaChallengeRedemption)
			.values({ signature, expiresAt })
			.onConflictDoNothing()
			.returning({ signature: altchaChallengeRedemption.signature })

		return redemption !== undefined
	})
}
