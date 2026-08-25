import { createHmac } from 'node:crypto'
import { createChallenge, pbkdf2, solveChallenge } from 'altcha/lib'
import { eq } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { altchaChallengeRedemption } from '~/db/schema'
import { verifyAndRedeemRegistrationChallenge } from '~/lib/altcha.server'

function deriveTestSecret(purpose: string) {
	return createHmac('sha256', process.env.SESSION_SECRET)
		.update(purpose)
		.digest('hex')
}

describe('ALTCHA registration verification', () => {
	let challengeSignature: string | undefined

	afterEach(async () => {
		if (challengeSignature) {
			await drizzleClient
				.delete(altchaChallengeRedemption)
				.where(eq(altchaChallengeRedemption.signature, challengeSignature))
		}
		challengeSignature = undefined
	})

	it('accepts a valid proof exactly once', async () => {
		const challenge = await createChallenge({
			algorithm: 'PBKDF2/SHA-256',
			cost: 5_000,
			counter: 0,
			data: { purpose: 'registration' },
			deriveKey: pbkdf2.deriveKey,
			expiresAt: new Date(Date.now() + 60_000),
			hmacKeySignatureSecret: deriveTestSecret('altcha:key-signature:v1'),
			hmacSignatureSecret: deriveTestSecret('altcha:challenge-signature:v1'),
		})
		const solution = await solveChallenge({
			challenge,
			deriveKey: pbkdf2.deriveKey,
		})

		expect(solution).not.toBeNull()
		expect(challenge.signature).toBeDefined()
		challengeSignature = challenge.signature
		const payload = Buffer.from(
			JSON.stringify({ challenge, solution }),
		).toString('base64')

		await expect(verifyAndRedeemRegistrationChallenge(payload)).resolves.toBe(
			true,
		)
		await expect(verifyAndRedeemRegistrationChallenge(payload)).resolves.toBe(
			false,
		)
	})

	it('rejects malformed payloads without throwing', async () => {
		await expect(
			verifyAndRedeemRegistrationChallenge('not base64'),
		).resolves.toBe(false)
	})
})
