import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import {
	rateLimitGrant,
	type RateLimitGrant,
	type RateLimitGrantKind,
	type RateLimitTier,
} from '~/db/schema'
import { drizzleClient } from '~/db.server'

export type ActiveRateLimitGrant = Pick<
	RateLimitGrant,
	'kind' | 'value' | 'tier'
>

export function normalizeRateLimitGrantValue(
	kind: RateLimitGrantKind,
	value: string,
) {
	const normalized = value.trim().toLowerCase()
	return kind === 'email_domain' ? normalized.replace(/^@/, '') : normalized
}

export async function getActiveRateLimitGrants(): Promise<
	ActiveRateLimitGrant[]
> {
	const now = new Date()

	const grants = await drizzleClient
		.select({
			kind: rateLimitGrant.kind,
			value: rateLimitGrant.value,
			tier: rateLimitGrant.tier,
		})
		.from(rateLimitGrant)
		.where(
			and(
				eq(rateLimitGrant.enabled, true),
				or(isNull(rateLimitGrant.expiresAt), gt(rateLimitGrant.expiresAt, now)),
			),
		)

	return grants.map((grant) => ({
		...grant,
		value: normalizeRateLimitGrantValue(grant.kind, grant.value),
	}))
}

export async function getRateLimitGrants() {
	return drizzleClient
		.select()
		.from(rateLimitGrant)
		.orderBy(rateLimitGrant.createdAt)
}

export async function createRateLimitGrant({
	kind,
	value,
	tier,
	note,
	expiresAt,
}: {
	kind: RateLimitGrantKind
	value: string
	tier: RateLimitTier
	note?: string | null
	expiresAt?: Date | null
}) {
	const [grant] = await drizzleClient
		.insert(rateLimitGrant)
		.values({
			kind,
			value: normalizeRateLimitGrantValue(kind, value),
			tier,
			note,
			expiresAt,
		})
		.returning()

	return grant
}

export async function updateRateLimitGrant(
	id: string,
	{
		kind,
		value,
		tier,
		enabled,
		note,
		expiresAt,
	}: {
		kind: RateLimitGrantKind
		value: string
		tier: RateLimitTier
		enabled: boolean
		note?: string | null
		expiresAt?: Date | null
	},
) {
	const [grant] = await drizzleClient
		.update(rateLimitGrant)
		.set({
			kind,
			value: normalizeRateLimitGrantValue(kind, value),
			tier,
			enabled,
			note,
			expiresAt,
			updatedAt: sql`NOW()`,
		})
		.where(eq(rateLimitGrant.id, id))
		.returning()

	return grant
}

export async function disableRateLimitGrant(id: string) {
	const [grant] = await drizzleClient
		.update(rateLimitGrant)
		.set({ enabled: false, updatedAt: sql`NOW()` })
		.where(eq(rateLimitGrant.id, id))
		.returning()

	return grant
}
