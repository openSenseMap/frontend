import { createHash } from 'node:crypto'
import jsonwebtoken, { type Algorithm } from 'jsonwebtoken'
import { compileApiRoutes, findApiRoute } from '~/lib/api-route-matching'
import {
	apiRoutes,
	type RateLimitConfig,
	type RouteInfo,
} from '~/lib/api-routes'

const { verify } = jsonwebtoken

type HttpMethod = RouteInfo['method']

type RateLimitBucket = {
	count: number
	resetAt: number
}

type RateLimitResult = {
	allowed: boolean
	limit: RateLimitConfig
	tier: string
	remaining: number
	resetAt: number
	retryAfterSeconds: number
}

type RateLimitTierGrant = {
	multiplier?: number
	users?: string[]
	emailDomains?: string[]
	credentialHashes?: string[]
}

type RateLimitTier = {
	name: string
	multiplier: number
	users: Set<string>
	emailDomains: Set<string>
	credentialHashes: Set<string>
}

const DEFAULT_WINDOW_MS = 60_000

const DEFAULT_LIMITS: Record<
	'auth' | 'noauth',
	Record<HttpMethod, RateLimitConfig>
> = {
	noauth: {
		GET: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 300 },
		POST: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		PUT: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		DELETE: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
	},
	auth: {
		GET: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 600 },
		POST: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 180 },
		PUT: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 120 },
		DELETE: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 120 },
	},
}

const compiledApiRoutes = compileApiRoutes(apiRoutes)
const buckets = new Map<string, RateLimitBucket>()
let lastCleanupAt = 0
let cachedTierConfigRaw: string | undefined
let cachedTierConfig: RateLimitTier[] = []

function json(body: unknown, status = 200, headers?: HeadersInit) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			...headers,
		},
	})
}

function getRateLimit(route: (typeof compiledApiRoutes)[number]) {
	if (route.route.rateLimit === false) return null
	return route.route.rateLimit ?? DEFAULT_LIMITS[route.kind][route.route.method]
}

function normalizeEmail(value: string) {
	return value.trim().toLowerCase()
}

function normalizeDomain(value: string) {
	return value.trim().replace(/^@/, '').toLowerCase()
}

function parseTierConfig() {
	const raw = process.env.API_RATE_LIMIT_TIERS
	if (raw === cachedTierConfigRaw) return cachedTierConfig

	cachedTierConfigRaw = raw
	cachedTierConfig = []

	if (!raw) return cachedTierConfig

	try {
		const parsed = JSON.parse(raw) as Record<string, RateLimitTierGrant>
		cachedTierConfig = Object.entries(parsed).map(([name, grant]) => ({
			name,
			multiplier: grant.multiplier ?? 1,
			users: new Set((grant.users ?? []).map(normalizeEmail)),
			emailDomains: new Set((grant.emailDomains ?? []).map(normalizeDomain)),
			credentialHashes: new Set(
				(grant.credentialHashes ?? []).map((hash) => hash.trim().toLowerCase()),
			),
		}))
	} catch (error) {
		console.error('Invalid API_RATE_LIMIT_TIERS configuration', error)
	}

	return cachedTierConfig
}

function getClientAddress(request: Request) {
	const forwardedFor = request.headers.get('x-forwarded-for')
	if (forwardedFor) return forwardedFor.split(',')[0]?.trim()

	return (
		request.headers.get('cf-connecting-ip') ??
		request.headers.get('fly-client-ip') ??
		request.headers.get('x-real-ip') ??
		'anonymous'
	)
}

function getRequesterCredential(request: Request) {
	const credential =
		request.headers.get('authorization') ??
		request.headers.get('x-osem-device-api-key') ??
		request.headers.get('x-service-key')

	if (!credential) return null

	return {
		raw: credential,
		hash: createHash('sha256').update(credential).digest('hex'),
	}
}

function getRequesterKey(request: Request) {
	const credential = getRequesterCredential(request)
	if (credential) return `credential:${credential.hash}`

	return `ip:${getClientAddress(request)}`
}

function getBearerToken(request: Request) {
	const rawAuthorizationHeader = request.headers.get('authorization')
	if (!rawAuthorizationHeader) return null

	const [bearer, jwtString] = rawAuthorizationHeader.split(' ')
	if (bearer !== 'Bearer' || !jwtString) return null

	return jwtString
}

function getVerifiedJwtPayload(request: Request) {
	const jwtString = getBearerToken(request)
	if (!jwtString) return null

	const { JWT_ALGORITHM, JWT_ISSUER, JWT_SECRET } = process.env
	if (!JWT_ALGORITHM || !JWT_ISSUER || !JWT_SECRET) return null

	try {
		const decoded = verify(jwtString, JWT_SECRET, {
			algorithms: [JWT_ALGORITHM as Algorithm],
			issuer: JWT_ISSUER,
		})

		return typeof decoded === 'string' ? null : decoded
	} catch {
		return null
	}
}

function emailMatchesTier(email: string, tier: RateLimitTier) {
	const normalizedEmail = normalizeEmail(email)
	const domain = normalizedEmail.split('@')[1]

	return (
		tier.users.has(normalizedEmail) ||
		(domain ? tier.emailDomains.has(domain) : false)
	)
}

function resolveRateLimitTier(request: Request) {
	const tiers = parseTierConfig()
	if (tiers.length === 0) return { name: 'default', multiplier: 1 }

	const credential = getRequesterCredential(request)
	if (credential) {
		const matchedCredentialTier = tiers.find((tier) =>
			tier.credentialHashes.has(credential.hash),
		)
		if (matchedCredentialTier) return matchedCredentialTier
	}

	const jwtPayload = getVerifiedJwtPayload(request)
	if (jwtPayload?.sub) {
		const matchedUserTier = tiers.find((tier) =>
			emailMatchesTier(String(jwtPayload.sub), tier),
		)
		if (matchedUserTier) return matchedUserTier
	}

	return { name: 'default', multiplier: 1 }
}

function resolveTierLimit(
	baseLimit: RateLimitConfig,
	tier: { name: string; multiplier: number },
) {
	const tierOverride = baseLimit.tiers?.[tier.name]
	const multiplier = tierOverride?.multiplier ?? tier.multiplier
	const maxRequests =
		tierOverride?.maxRequests ??
		Math.max(1, Math.floor(baseLimit.maxRequests * multiplier))

	return {
		windowMs: baseLimit.windowMs,
		maxRequests,
	} satisfies RateLimitConfig
}

function cleanupBuckets(now: number) {
	if (now - lastCleanupAt < DEFAULT_WINDOW_MS) return
	lastCleanupAt = now

	for (const [key, bucket] of buckets.entries()) {
		if (bucket.resetAt <= now) buckets.delete(key)
	}
}

export function resetApiRateLimitForTests() {
	buckets.clear()
	lastCleanupAt = 0
	cachedTierConfigRaw = undefined
	cachedTierConfig = []
}

export function checkApiRateLimit(request: Request, now = Date.now()) {
	const url = new URL(request.url)
	const route = findApiRoute(request, url.pathname, compiledApiRoutes)
	if (!route) return null

	const baseLimit = getRateLimit(route)
	if (!baseLimit) return null

	const tier = resolveRateLimitTier(request)
	const limit = resolveTierLimit(baseLimit, tier)

	cleanupBuckets(now)

	const key = [
		route.kind,
		route.route.method,
		route.route.path,
		tier.name,
		getRequesterKey(request),
	].join(':')

	const existing = buckets.get(key)
	const bucket =
		existing && existing.resetAt > now
			? existing
			: { count: 0, resetAt: now + limit.windowMs }

	bucket.count += 1
	buckets.set(key, bucket)

	const remaining = Math.max(limit.maxRequests - bucket.count, 0)
	const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000)

	return {
		allowed: bucket.count <= limit.maxRequests,
		limit,
		tier: tier.name,
		remaining,
		resetAt: bucket.resetAt,
		retryAfterSeconds,
	} satisfies RateLimitResult
}

function rateLimitHeaders(result: RateLimitResult) {
	return {
		'RateLimit-Limit': String(result.limit.maxRequests),
		'RateLimit-Remaining': String(result.remaining),
		'RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
		'RateLimit-Policy': `${result.limit.maxRequests};w=${Math.ceil(
			result.limit.windowMs / 1000,
		)};tier="${result.tier}"`,
		'Retry-After': String(result.retryAfterSeconds),
	}
}

export async function apiRateLimitMiddleware(
	{ request }: { request: Request },
	next: () => Promise<Response>,
) {
	const result = checkApiRateLimit(request)
	if (!result) return next()

	if (!result.allowed) {
		return json(
			{
				code: 'rate_limit_exceeded',
				message: 'Too many requests. Please retry after the rate limit resets.',
			},
			429,
			rateLimitHeaders(result),
		)
	}

	const response = await next()
	for (const [header, value] of Object.entries(rateLimitHeaders(result))) {
		if (header === 'Retry-After') continue
		response.headers.set(header, value)
	}
	return response
}
