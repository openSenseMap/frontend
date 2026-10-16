import { createHash } from 'node:crypto'
import { getDeviceRateLimitIdentity } from '~/db/models/device.server'
import { isValidServiceKey } from '~/db/models/integration.server'
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
import { getUserFromJwt } from '~/lib/jwt'

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

type RequesterIdentity =
	| { key: string; kind: 'anonymous' | 'device' | 'service' }
	| { key: string; kind: 'credential'; grant: ActiveRateLimitGrant }
	| { key: string; kind: 'user'; email: string }

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
		GET: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		POST: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		PUT: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		DELETE: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
	},
	auth: {
		GET: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		POST: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		PUT: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 60 },
		DELETE: { windowMs: DEFAULT_WINDOW_MS, maxRequests: 30 },
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

function hashCredential(credential: string) {
	return createHash('sha256').update(credential).digest('hex')
}

function getCredentialCandidates(request: Request) {
	const credentials = [
		request.headers.get('authorization'),
		request.headers.get('x-osem-device-api-key'),
		request.headers.get('x-service-key'),
	].filter((credential): credential is string => Boolean(credential))

	return [...new Set(credentials)].map((raw) => ({
		raw,
		hash: hashCredential(raw),
	}))
}

const DEVICE_CREDENTIAL_ROUTE_PATHS = new Set([
	'boxes/:boxId/data',
	'boxes/:boxId/:sensorId',
])

function isDeviceCredentialRoute(route: (typeof compiledApiRoutes)[number]) {
	return (
		route.route.method === 'POST' &&
		DEVICE_CREDENTIAL_ROUTE_PATHS.has(route.route.path)
	)
}

function getRouteParameter(
	routePath: string,
	pathname: string,
	parameter: string,
) {
	const routeSegments = ['api', ...routePath.split('/')]
	const pathSegments = pathname.split('/').filter(Boolean)
	if (routeSegments.length !== pathSegments.length) return null

	const parameterIndex = routeSegments.indexOf(`:${parameter}`)
	if (parameterIndex === -1) return null

	try {
		return decodeURIComponent(pathSegments[parameterIndex])
	} catch {
		return null
	}
}

function getDeviceCredential(
	request: Request,
	route: (typeof compiledApiRoutes)[number],
) {
	const authorization = request.headers.get('authorization')
	if (route.route.path === 'boxes/:boxId/data') {
		return authorization ?? request.headers.get('x-osem-device-api-key')
	}

	return authorization
}

async function getVerifiedUserEmail(request: Request) {
	if (!request.headers.get('authorization')?.startsWith('Bearer ')) return null

	try {
		const user = await getUserFromJwt(request)
		return typeof user === 'string' ? null : normalizeEmail(user.email)
	} catch {
		// Invalid, revoked, or orphaned credentials must use the anonymous bucket.
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

function tierFromGrant(grant: ActiveRateLimitGrant): ResolvedRateLimitTier {
	return {
		name: grant.tier,
		multiplier: RATE_LIMIT_TIERS[grant.tier].multiplier,
	}
}

function resolveRateLimitTier(
	identity: RequesterIdentity,
	grants: ActiveRateLimitGrant[],
): ResolvedRateLimitTier {
	if (identity.kind === 'credential') return tierFromGrant(identity.grant)

	if (identity.kind === 'user') {
		const matchedUserGrant = grants.find((grant) =>
			emailMatchesGrant(identity.email, grant),
		)
		if (matchedUserGrant) return tierFromGrant(matchedUserGrant)
	}

	return DEFAULT_RATE_LIMIT_TIER
}

async function resolveRequesterIdentity(
	request: Request,
	url: URL,
	route: (typeof compiledApiRoutes)[number],
	grants: ActiveRateLimitGrant[],
): Promise<RequesterIdentity> {
	const email = await getVerifiedUserEmail(request)
	if (email) {
		return { key: `user:${email}`, kind: 'user', email }
	}

	for (const credential of getCredentialCandidates(request)) {
		const matchedCredentialGrant = grants.find(
			(grant) =>
				grant.kind === 'credential_hash' && grant.value === credential.hash,
		)
		if (matchedCredentialGrant) {
			return {
				key: `credential:${credential.hash}`,
				kind: 'credential',
				grant: matchedCredentialGrant,
			}
		}
	}

	if (isDeviceCredentialRoute(route)) {
		const serviceKey = request.headers.get('x-service-key')
		if (serviceKey) {
			try {
				if (await isValidServiceKey(serviceKey)) {
					return {
						key: `service:${hashCredential(serviceKey)}`,
						kind: 'service',
					}
				}
			} catch (error) {
				console.error(
					'Unable to validate API service key for rate limiting',
					error,
				)
			}
		}

		const deviceId = getRouteParameter(route.route.path, url.pathname, 'boxId')
		const deviceCredential = getDeviceCredential(request, route)
		if (deviceId && deviceCredential) {
			try {
				const device = await getDeviceRateLimitIdentity({ id: deviceId })
				if (
					device?.useAuth &&
					device.apiKey &&
					device.apiKey === deviceCredential
				) {
					return { key: `device:${device.id}`, kind: 'device' }
				}
			} catch (error) {
				console.error(
					'Unable to validate device API key for rate limiting',
					error,
				)
			}
		}
	}

	return { key: 'anonymous', kind: 'anonymous' }
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

	const grants = await getCachedRateLimitGrants(now)
	const identity = await resolveRequesterIdentity(request, url, route, grants)
	const tier = resolveRateLimitTier(identity, grants)
	const limit = resolveTierLimit(baseLimit, tier)

	cleanupBuckets(now)

	const key = [
		route.kind,
		route.route.method,
		route.route.path,
		tier.name,
		identity.key,
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
		'RateLimit-Reset': String(result.retryAfterSeconds),
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
