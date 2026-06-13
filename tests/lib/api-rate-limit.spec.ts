import { createHash } from 'node:crypto'
import jsonwebtoken from 'jsonwebtoken'
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
		delete process.env.API_RATE_LIMIT_TIERS
		resetApiRateLimitForTests()
	})

	it('limits sensitive auth endpoints with route-specific limits', () => {
		let result: ReturnType<typeof checkApiRateLimit> = null

		for (let i = 0; i < 10; i++) {
			result = checkApiRateLimit(
				new Request(`${BASE_URL}/api/users/sign-in`, {
					method: 'POST',
					headers: { 'x-forwarded-for': '203.0.113.1' },
				}),
				1_000,
			)
			expect(result?.allowed).toBe(true)
		}

		result = checkApiRateLimit(
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

	it('separates buckets by credential before falling back to the client address', () => {
		for (let i = 0; i < 10; i++) {
			checkApiRateLimit(
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

		const sameAddressDifferentCredential = checkApiRateLimit(
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

	it('can grant a higher tier by credential hash', () => {
		const credential = 'school-device-api-key'
		const credentialHash = createHash('sha256').update(credential).digest('hex')
		process.env.API_RATE_LIMIT_TIERS = JSON.stringify({
			education: {
				multiplier: 2,
				credentialHashes: [credentialHash],
			},
		})

		const result = checkApiRateLimit(
			new Request(`${BASE_URL}/api/users/sign-in`, {
				method: 'POST',
				headers: { 'x-osem-device-api-key': credential },
			}),
			1_000,
		)

		expect(result?.tier).toBe('education')
		expect(result?.limit.maxRequests).toBe(20)
		expect(result?.remaining).toBe(19)
	})

	it('can grant a higher tier by verified JWT email domain', () => {
		const originalAlgorithm = process.env.JWT_ALGORITHM
		const originalIssuer = process.env.JWT_ISSUER
		const originalSecret = process.env.JWT_SECRET

		try {
			process.env.JWT_ALGORITHM = 'HS256'
			process.env.JWT_ISSUER = 'opensensemap-test'
			process.env.JWT_SECRET = 'test-secret'
			process.env.API_RATE_LIMIT_TIERS = JSON.stringify({
				education: {
					multiplier: 3,
					emailDomains: ['school.example'],
				},
			})

			const token = sign({ role: 'user' }, process.env.JWT_SECRET, {
				algorithm: 'HS256',
				issuer: process.env.JWT_ISSUER,
				subject: 'teacher@school.example',
			})

			const result = checkApiRateLimit(
				new Request(`${BASE_URL}/api/users/sign-in`, {
					method: 'POST',
					headers: { authorization: `Bearer ${token}` },
				}),
				1_000,
			)

			expect(result?.tier).toBe('education')
			expect(result?.limit.maxRequests).toBe(30)
		} finally {
			restoreEnv('JWT_ALGORITHM', originalAlgorithm)
			restoreEnv('JWT_ISSUER', originalIssuer)
			restoreEnv('JWT_SECRET', originalSecret)
		}
	})

	it('opens a new bucket after the configured window resets', () => {
		for (let i = 0; i < 10; i++) {
			checkApiRateLimit(
				new Request(`${BASE_URL}/api/users/sign-in`, {
					method: 'POST',
					headers: { 'x-forwarded-for': '203.0.113.3' },
				}),
				1_000,
			)
		}

		const resetResult = checkApiRateLimit(
			new Request(`${BASE_URL}/api/users/sign-in`, {
				method: 'POST',
				headers: { 'x-forwarded-for': '203.0.113.3' },
			}),
			61_001,
		)

		expect(resetResult?.allowed).toBe(true)
		expect(resetResult?.remaining).toBe(9)
	})

	it('does not rate limit URLs that are not defined in apiRoutes', () => {
		const result = checkApiRateLimit(
			new Request(`${BASE_URL}/api/unknown`, { method: 'GET' }),
			1_000,
		)

		expect(result).toBeNull()
	})
})
