import { createHash } from 'node:crypto'
import jsonwebtoken, { type Algorithm } from 'jsonwebtoken'
import {
	getActiveRateLimitGrants,
	type ActiveRateLimitGrant,
} from '~/db/models/rate-limit-grant.server'
import { type RateLimitTier } from '~/db/schema'
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
	tier: RateLimitTierName
	remaining: number
	resetAt: number
	retryAfterSeconds: number
}

type RateLimitTierName = 'default' | RateLimitTier
type ResolvedRateLimitTier = {
	name: RateLimitTierName
	multiplier: number
}

const DEFAULT_WINDOW_MS = 60_000
const GRANT_CACHE_TTL_MS = 60_000

const RATE_LIMIT_TIERS = {
	default: { multiplier: 1 },
	standard_plus: { multiplier: 5 },
	trusted: { multiplier: 10 },
	high_volume: { multiplier: 25 },
} satisfies Record<RateLimitTierName, { multiplier: number }>

const DEFAULT_RATE_LIMIT_TIER: ResolvedRateLimitTier = {
	name: 'default',
	multiplier: RATE_LIMIT_TIERS.default.multiplier,
}

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
let cachedGrants: ActiveRateLimitGrant[] = []
let cachedGrantsUntil = 0

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

async function getCachedRateLimitGrants(now: number) {
	if (cachedGrantsUntil > now) return cachedGrants

	try {
		cachedGrants = await getActiveRateLimitGrants()
		cachedGrantsUntil = now + GRANT_CACHE_TTL_MS
	} catch (error) {
		console.error('Unable to load API rate limit grants', error)
		cachedGrantsUntil = now + Math.min(GRANT_CACHE_TTL_MS, 10_000)
	}

	return cachedGrants
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
	const jwtPayload = getVerifiedJwtPayload(request)
	if (jwtPayload?.sub) return `user:${normalizeEmail(String(jwtPayload.sub))}`

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

function emailMatchesGrant(email: string, grant: ActiveRateLimitGrant) {
	const normalizedEmail = normalizeEmail(email)
	const domain = normalizedEmail.split('@')[1]

	if (grant.kind === 'user_email') return grant.value === normalizedEmail
	if (grant.kind === 'email_domain')
		return domain === normalizeDomain(grant.value)
	return false
}

async function resolveRateLimitTier(
	request: Request,
	now: number,
): Promise<ResolvedRateLimitTier> {
	const grants = await getCachedRateLimitGrants(now)
	if (grants.length === 0) return DEFAULT_RATE_LIMIT_TIER

	const credential = getRequesterCredential(request)
	if (credential) {
		const matchedCredentialGrant = grants.find(
			(grant) =>
				grant.kind === 'credential_hash' && grant.value === credential.hash,
		)
		if (matchedCredentialGrant)
			return {
				name: matchedCredentialGrant.tier,
				multiplier: RATE_LIMIT_TIERS[matchedCredentialGrant.tier].multiplier,
			}
	}

	const jwtPayload = getVerifiedJwtPayload(request)
	if (jwtPayload?.sub) {
		const matchedUserGrant = grants.find((grant) =>
			emailMatchesGrant(String(jwtPayload.sub), grant),
		)
		if (matchedUserGrant)
			return {
				name: matchedUserGrant.tier,
				multiplier: RATE_LIMIT_TIERS[matchedUserGrant.tier].multiplier,
			}
	}

	return DEFAULT_RATE_LIMIT_TIER
}

function resolveTierLimit(
	baseLimit: RateLimitConfig,
	tier: ResolvedRateLimitTier,
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
	cachedGrants = []
	cachedGrantsUntil = 0
}

export async function checkApiRateLimit(request: Request, now = Date.now()) {
	const url = new URL(request.url)
	const route = findApiRoute(request, url.pathname, compiledApiRoutes)
	if (!route) return null

	const baseLimit = getRateLimit(route)
	if (!baseLimit) return null

	const tier = await resolveRateLimitTier(request, now)
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
	const result = await checkApiRateLimit(request)
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
