import { createHmac, randomInt } from 'node:crypto'
import {
	createChallenge,
	pbkdf2,
	verifySolution,
	type Challenge,
	type Payload,
} from 'altcha/lib'
import invariant from 'tiny-invariant'
import * as z from 'zod/v4'
import { redeemAltchaChallenge } from '~/db/models/altcha-challenge-redemption.server'

const ALGORITHM = 'PBKDF2/SHA-256'
const COST = 5_000
const COUNTER_MIN = 5_000
const COUNTER_MAX_EXCLUSIVE = 10_001
const CHALLENGE_TTL_MS = 20 * 60 * 1_000
const MAX_PAYLOAD_LENGTH = 16_384
const PURPOSE = 'registration'

const hexSchema = z.string().regex(/^[0-9a-f]+$/i)
const challengeSchema = z
	.object({
		parameters: z
			.object({
				algorithm: z.string(),
				nonce: hexSchema.length(32),
				salt: hexSchema.length(32),
				cost: z.number().int().positive().max(1_000_000),
				keyLength: z.number().int().positive().max(128),
				keyPrefix: hexSchema.length(32),
				keySignature: hexSchema.length(64).optional(),
				memoryCost: z.number().int().positive().optional(),
				parallelism: z.number().int().positive().optional(),
				expiresAt: z.number().int().positive().optional(),
				data: z
					.record(
						z.string(),
						z.union([z.string(), z.number(), z.boolean(), z.null()]),
					)
					.optional(),
			})
			.strict(),
		signature: hexSchema.length(64),
	})
	.strict()

const payloadSchema = z
	.object({
		challenge: challengeSchema,
		solution: z
			.object({
				counter: z.number().int().nonnegative().max(0xffffffff),
				derivedKey: hexSchema.length(64),
				time: z.number().finite().nonnegative().optional(),
			})
			.strict(),
	})
	.strict()

function getSecrets() {
	const sessionSecret = process.env.SESSION_SECRET
	invariant(sessionSecret, 'SESSION_SECRET must be set')

	const deriveSecret = (purpose: string) =>
		createHmac('sha256', sessionSecret).update(purpose).digest('hex')

	return {
		hmacSignatureSecret: deriveSecret('altcha:challenge-signature:v1'),
		hmacKeySignatureSecret: deriveSecret('altcha:key-signature:v1'),
	}
}

export async function createRegistrationChallenge(): Promise<Challenge> {
	const { hmacKeySignatureSecret, hmacSignatureSecret } = getSecrets()

	return createChallenge({
		algorithm: ALGORITHM,
		cost: COST,
		counter: randomInt(COUNTER_MIN, COUNTER_MAX_EXCLUSIVE),
		data: { purpose: PURPOSE },
		deriveKey: pbkdf2.deriveKey,
		expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
		hmacKeySignatureSecret,
		hmacSignatureSecret,
	})
}

function parsePayload(value: unknown): Payload | null {
	if (
		typeof value !== 'string' ||
		value.length === 0 ||
		value.length > MAX_PAYLOAD_LENGTH ||
		!/^[A-Za-z0-9+/]+={0,2}$/.test(value)
	) {
		return null
	}

	try {
		const decoded = Buffer.from(value, 'base64').toString('utf8')
		const parsed = payloadSchema.safeParse(JSON.parse(decoded))
		return parsed.success ? (parsed.data as Payload) : null
	} catch {
		return null
	}
}

export async function verifyAndRedeemRegistrationChallenge(
	value: unknown,
): Promise<boolean> {
	const payload = parsePayload(value)
	if (!payload) return false

	const { challenge, solution } = payload
	const { parameters, signature } = challenge

	if (
		!signature ||
		parameters.algorithm !== ALGORITHM ||
		parameters.cost !== COST ||
		parameters.keyLength !== 32 ||
		parameters.data?.purpose !== PURPOSE ||
		!parameters.expiresAt ||
		!parameters.keySignature
	) {
		return false
	}

	let verification: Awaited<ReturnType<typeof verifySolution>>
	try {
		const { hmacKeySignatureSecret, hmacSignatureSecret } = getSecrets()
		verification = await verifySolution({
			challenge,
			deriveKey: pbkdf2.deriveKey,
			hmacKeySignatureSecret,
			hmacSignatureSecret,
			solution,
		})
	} catch {
		return false
	}

	if (!verification.verified) return false

	return redeemAltchaChallenge(
		signature,
		new Date(parameters.expiresAt * 1_000),
	)
}
