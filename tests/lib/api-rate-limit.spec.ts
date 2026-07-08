import { createHash } from 'node:crypto'
import jsonwebtoken from 'jsonwebtoken'

const { activeGrants } = vi.hoisted(() => ({
	activeGrants: [] as Array<{
		kind: 'user_email' | 'email_domain' | 'credential_hash'
		value: string
		tier: 'standard_plus' | 'trusted' | 'high_volume'
	}>,
}))

vi.mock('~/db/models/rate-limit-grant.server', () => ({
	getActiveRateLimitGrants: vi.fn(async () => activeGrants),
}))

import {
	checkApiRateLimit,
	resetApiRateLimitForTests,
} from '~/middleware/rate-limit-api.server'

const BASE_URL = 'http://localhost:4200'
const { sign } = jsonwebtoken

function restoreEnv(name: string, value: string | undefined) {
	if (value === undefined) delete process.env[name]
	else process.env[name] = value
}

describe('API rate limiting', () => {
	beforeEach(() => {
		activeGrants.length = 0
		resetApiRateLimitForTests()
	})

	it('limits sensitive auth endpoints with route-specific limits', async () => {
		let result: Awaited<ReturnType<typeof checkApiRateLimit>> = null

		for (let i = 0; i < 10; i++) {
			result = await checkApiRateLimit(
				new Request(`${BASE_URL}/api/users/sign-in`, {
					method: 'POST',
					headers: { 'x-forwarded-for': '203.0.113.1' },
				}),
				1_000,
			)
			expect(result?.allowed).toBe(true)
		}

		result = await checkApiRateLimit(
			new Request(`${BASE_URL}/api/users/sign-in`, {
				method: 'POST',
				headers: { 'x-forwarded-for': '203.0.113.1' },
			}),
			1_000,
		)

		expect(result?.allowed).toBe(false)
		expect(result?.limit.maxRequests).toBe(10)
		expect(result?.retryAfterSeconds).toBe(60)
	})

	it('separates buckets by credential before falling back to the client address', async () => {
		for (let i = 0; i < 10; i++) {
			await checkApiRateLimit(
				new Request(`${BASE_URL}/api/users/sign-in`, {
					method: 'POST',
					headers: {
						authorization: 'Bearer first-token',
						'x-forwarded-for': '203.0.113.2',
					},
				}),
				1_000,
			)
		}

		const sameAddressDifferentCredential = await checkApiRateLimit(
			new Request(`${BASE_URL}/api/users/sign-in`, {
				method: 'POST',
				headers: {
					authorization: 'Bearer second-token',
					'x-forwarded-for': '203.0.113.2',
				},
			}),
			1_000,
		)

		expect(sameAddressDifferentCredential?.allowed).toBe(true)
		expect(sameAddressDifferentCredential?.remaining).toBe(9)
	})

	it('can grant a higher tier by credential hash', async () => {
		const credential = 'school-device-api-key'
		const credentialHash = createHash('sha256').update(credential).digest('hex')
		activeGrants.push({
			kind: 'credential_hash',
			value: credentialHash,
			tier: 'standard_plus',
		})

		const result = await checkApiRateLimit(
			new Request(`${BASE_URL}/api/users/sign-in`, {
				method: 'POST',
				headers: { 'x-osem-device-api-key': credential },
			}),
			1_000,
		)

		expect(result?.tier).toBe('standard_plus')
		expect(result?.limit.maxRequests).toBe(50)
		expect(result?.remaining).toBe(49)
	})

	it('can grant a higher tier by verified JWT email domain', async () => {
		const originalAlgorithm = process.env.JWT_ALGORITHM
		const originalIssuer = process.env.JWT_ISSUER
		const originalSecret = process.env.JWT_SECRET

		try {
			process.env.JWT_ALGORITHM = 'HS256'
			process.env.JWT_ISSUER = 'opensensemap-test'
			process.env.JWT_SECRET = 'test-secret'
			activeGrants.push({
				kind: 'email_domain',
				value: 'school.example',
				tier: 'standard_plus',
			})

			const token = sign({ role: 'user' }, process.env.JWT_SECRET, {
				algorithm: 'HS256',
				issuer: process.env.JWT_ISSUER,
				subject: 'teacher@school.example',
			})

			const result = await checkApiRateLimit(
				new Request(`${BASE_URL}/api/users/sign-in`, {
					method: 'POST',
					headers: { authorization: `Bearer ${token}` },
				}),
				1_000,
			)

			expect(result?.tier).toBe('standard_plus')
			expect(result?.limit.maxRequests).toBe(50)
		} finally {
			restoreEnv('JWT_ALGORITHM', originalAlgorithm)
			restoreEnv('JWT_ISSUER', originalIssuer)
			restoreEnv('JWT_SECRET', originalSecret)
		}
	})

	it('opens a new bucket after the configured window resets', async () => {
		for (let i = 0; i < 10; i++) {
			await checkApiRateLimit(
				new Request(`${BASE_URL}/api/users/sign-in`, {
					method: 'POST',
					headers: { 'x-forwarded-for': '203.0.113.3' },
				}),
				1_000,
			)
		}

		const resetResult = await checkApiRateLimit(
			new Request(`${BASE_URL}/api/users/sign-in`, {
				method: 'POST',
				headers: { 'x-forwarded-for': '203.0.113.3' },
			}),
			61_001,
		)

		expect(resetResult?.allowed).toBe(true)
		expect(resetResult?.remaining).toBe(9)
	})

	it('does not rate limit URLs that are not defined in apiRoutes', async () => {
		const result = await checkApiRateLimit(
			new Request(`${BASE_URL}/api/unknown`, { method: 'GET' }),
			1_000,
		)

		expect(result).toBeNull()
	})
})
