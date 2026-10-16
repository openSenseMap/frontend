import { createHash } from 'node:crypto'
import jsonwebtoken from 'jsonwebtoken'

const mocks = vi.hoisted(() => ({
	activeGrants: [] as Array<{
		kind: 'user_email' | 'email_domain' | 'credential_hash'
		value: string
		tier: 'standard_plus' | 'trusted' | 'high_volume'
	}>,
	getDeviceRateLimitIdentity: vi.fn(
		async (_input: { id: string }) =>
			undefined as
				| { id: string; useAuth: boolean; apiKey: string | null }
				| undefined,
	),
	getUserFromJwt: vi.fn(
		async (
			_request: Request,
		): Promise<
			| { email: string }
			| 'no_token'
			| 'invalid_token_type'
			| 'verification_error'
		> => 'verification_error',
	),
	isValidServiceKey: vi.fn(async (_serviceKey: string | null) => false),
}))

vi.mock('~/db/models/rate-limit-grant.server', () => ({
	getActiveRateLimitGrants: vi.fn(async () => mocks.activeGrants),
}))

vi.mock('~/db/models/device.server', () => ({
	getDeviceRateLimitIdentity: mocks.getDeviceRateLimitIdentity,
}))

vi.mock('~/db/models/integration.server', () => ({
	isValidServiceKey: mocks.isValidServiceKey,
}))

vi.mock('~/lib/jwt', () => ({
	getUserFromJwt: mocks.getUserFromJwt,
}))

import {
	checkApiRateLimit,
	resetApiRateLimitForTests,
} from '~/middleware/rate-limit-api.server'

const BASE_URL = 'http://localhost:4200'
const JWT_ISSUER = 'opensensemap-rate-limit-test'
const JWT_SECRET = 'rate-limit-test-secret'
const { sign } = jsonwebtoken

function request(path: string, headers?: HeadersInit) {
	return new Request(`${BASE_URL}${path}`, {
		method: 'POST',
		headers,
	})
}

function check(
	path: string,
	{
		headers,
		now = 1_000,
	}: {
		headers?: HeadersInit
		now?: number
	} = {},
) {
	return checkApiRateLimit(request(path, headers), now)
}

describe('API rate limiting', () => {
	beforeEach(() => {
		mocks.activeGrants.length = 0
		mocks.getDeviceRateLimitIdentity.mockClear()
		mocks.getDeviceRateLimitIdentity.mockImplementation(
			async (_input: { id: string }) => undefined,
		)
		mocks.getUserFromJwt.mockClear()
		mocks.getUserFromJwt.mockImplementation(async () => 'verification_error')
		mocks.isValidServiceKey.mockClear()
		mocks.isValidServiceKey.mockImplementation(async () => false)
		resetApiRateLimitForTests()
	})

	it.each([
		['sign-in', '/api/users/sign-in', 10],
		['registration', '/api/users/register', 5],
		['password-reset request', '/api/users/request-password-reset', 5],
		['password reset', '/api/users/password-reset', 5],
	])(
		'falls back to one anonymous bucket for rotating invalid bearer tokens on %s',
		async (_name, path, maxRequests) => {
			let result: Awaited<ReturnType<typeof checkApiRateLimit>> = null

			for (let index = 0; index <= maxRequests; index++) {
				result = await check(path, {
					headers: { authorization: `Bearer invalid-token-${index}` },
				})
			}

			expect(result?.allowed).toBe(false)
			expect(result?.limit.maxRequests).toBe(maxRequests)
			expect(result?.remaining).toBe(0)
			expect(mocks.getDeviceRateLimitIdentity).not.toHaveBeenCalled()
			expect(mocks.isValidServiceKey).not.toHaveBeenCalled()
		},
	)

	it('ignores rotating unverified device, service, and forwarding headers', async () => {
		const deviceId = 'device-with-auth'
		mocks.getDeviceRateLimitIdentity.mockResolvedValue({
			id: deviceId,
			useAuth: true,
			apiKey: 'actual-device-key',
		})

		let result: Awaited<ReturnType<typeof checkApiRateLimit>> = null
		for (let index = 0; index < 7; index++) {
			const rotatingCredential: Record<string, string> =
				index % 2 === 0
					? { 'x-osem-device-api-key': `invalid-device-key-${index}` }
					: { 'x-service-key': `invalid-service-key-${index}` }

			result = await check(`/api/boxes/${deviceId}/data`, {
				headers: {
					...rotatingCredential,
					'x-forwarded-for': `198.51.100.${index}, 10.0.0.2`,
					'cf-connecting-ip': `192.0.2.${index}`,
					'fly-client-ip': `192.0.2.${index + 20}`,
					'x-real-ip': `192.0.2.${index + 40}`,
				},
			})
		}

		expect(result?.allowed).toBe(false)
		expect(result?.limit.maxRequests).toBe(6)
		expect(mocks.getDeviceRateLimitIdentity).toHaveBeenCalledWith({
			id: deviceId,
		})
		expect(mocks.isValidServiceKey).toHaveBeenCalled()
	})

	it('shares a bucket between distinct verified JWTs for the same subject', async () => {
		const firstToken = sign({ role: 'user' }, JWT_SECRET, {
			algorithm: 'HS256',
			issuer: JWT_ISSUER,
			subject: 'RateLimit.User@Example.com',
			jwtid: 'first-session',
		})
		const secondToken = sign({ role: 'user' }, JWT_SECRET, {
			algorithm: 'HS256',
			issuer: JWT_ISSUER,
			subject: 'ratelimit.user@example.com',
			jwtid: 'second-session',
		})

		expect(firstToken).not.toBe(secondToken)
		mocks.getUserFromJwt.mockImplementation(async (candidate) => {
			const authorization = candidate.headers.get('authorization')
			return authorization === `Bearer ${firstToken}` ||
				authorization === `Bearer ${secondToken}`
				? { email: 'RateLimit.User@Example.com' }
				: 'verification_error'
		})

		for (let index = 0; index < 10; index++) {
			const result = await check('/api/users/sign-in', {
				headers: {
					authorization: `Bearer ${index % 2 === 0 ? firstToken : secondToken}`,
				},
			})
			expect(result?.allowed).toBe(true)
		}

		const result = await check('/api/users/sign-in', {
			headers: { authorization: `Bearer ${secondToken}` },
		})

		expect(result?.allowed).toBe(false)
		expect(result?.remaining).toBe(0)
	})

	it('uses the anonymous bucket when application JWT verification rejects signed tokens', async () => {
		const missingIdToken = sign({ role: 'user' }, JWT_SECRET, {
			algorithm: 'HS256',
			issuer: JWT_ISSUER,
			subject: 'former.user@example.com',
		})
		const revokedToken = sign({ role: 'user' }, JWT_SECRET, {
			algorithm: 'HS256',
			issuer: JWT_ISSUER,
			subject: 'former.user@example.com',
			jwtid: 'revoked-session',
		})

		let result: Awaited<ReturnType<typeof checkApiRateLimit>> = null
		for (let index = 0; index < 11; index++) {
			result = await check('/api/users/sign-in', {
				headers: {
					authorization: `Bearer ${index % 2 === 0 ? missingIdToken : revokedToken}`,
				},
			})
		}

		expect(result?.allowed).toBe(false)
		expect(result?.remaining).toBe(0)
		expect(mocks.getUserFromJwt).toHaveBeenCalledTimes(11)
	})

	it('uses an active credential-hash grant as a trusted identity', async () => {
		const credential = 'registered-school-device-key'
		mocks.activeGrants.push({
			kind: 'credential_hash',
			value: createHash('sha256').update(credential).digest('hex'),
			tier: 'standard_plus',
		})

		const first = await check('/api/users/sign-in', {
			headers: { 'x-osem-device-api-key': credential },
		})
		const second = await check('/api/users/sign-in', {
			headers: { 'x-osem-device-api-key': credential },
		})

		expect(first?.tier).toBe('standard_plus')
		expect(first?.limit.maxRequests).toBe(50)
		expect(first?.remaining).toBe(49)
		expect(second?.tier).toBe('standard_plus')
		expect(second?.remaining).toBe(48)
	})

	it('uses a verified device key as a stable route-specific identity', async () => {
		const deviceId = 'verified-device'
		const deviceKey = 'verified-device-key'
		mocks.getDeviceRateLimitIdentity.mockImplementation(async ({ id }) =>
			id === deviceId ? { id, useAuth: true, apiKey: deviceKey } : undefined,
		)

		for (let index = 0; index < 6; index++) {
			const headers: Record<string, string> =
				index % 2 === 0
					? { authorization: deviceKey }
					: { 'x-osem-device-api-key': deviceKey }
			const result = await check(`/api/boxes/${deviceId}/data`, {
				headers,
			})
			expect(result?.allowed).toBe(true)
		}

		const result = await check(`/api/boxes/${deviceId}/data`, {
			headers: { 'x-osem-device-api-key': deviceKey },
		})

		expect(result?.allowed).toBe(false)
		expect(mocks.getDeviceRateLimitIdentity).toHaveBeenCalledWith({
			id: deviceId,
		})
	})

	it('uses a verified service key as a stable identity', async () => {
		const serviceKey = 'verified-service-key'
		mocks.isValidServiceKey.mockImplementation(
			async (candidate) => candidate === serviceKey,
		)

		for (let index = 0; index < 6; index++) {
			const result = await check('/api/boxes/service-device/data', {
				headers: { 'x-service-key': serviceKey },
			})
			expect(result?.allowed).toBe(true)
		}

		const result = await check('/api/boxes/service-device/data', {
			headers: { 'x-service-key': serviceKey },
		})

		expect(result?.allowed).toBe(false)
		expect(mocks.isValidServiceKey).toHaveBeenCalledWith(serviceKey)
	})

	it('can grant a higher tier by verified JWT email domain', async () => {
		mocks.activeGrants.push({
			kind: 'email_domain',
			value: 'school.example',
			tier: 'standard_plus',
		})

		const token = sign({ role: 'user' }, JWT_SECRET, {
			algorithm: 'HS256',
			issuer: JWT_ISSUER,
			subject: 'teacher@school.example',
			jwtid: 'teacher-session',
		})
		mocks.getUserFromJwt.mockResolvedValue({
			email: 'teacher@school.example',
		})

		const result = await check('/api/users/sign-in', {
			headers: { authorization: `Bearer ${token}` },
		})

		expect(result?.tier).toBe('standard_plus')
		expect(result?.limit.maxRequests).toBe(50)
	})

	it('opens a new bucket after the configured window resets', async () => {
		for (let index = 0; index < 10; index++) {
			await check('/api/users/sign-in')
		}

		const resetResult = await check('/api/users/sign-in', { now: 61_001 })

		expect(resetResult?.allowed).toBe(true)
		expect(resetResult?.remaining).toBe(9)
	})

	it('does not rate limit URLs that are not defined in apiRoutes', async () => {
		const result = await check('/api/unknown')

		expect(result).toBeNull()
	})
})
