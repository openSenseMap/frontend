import { drizzleClient } from '~/db.server'
import { tosUserState } from '~/schema/tos'

export const ONE_DAY_MS = 24 * 60 * 60 * 1000
export const TOS_GRACE_DAYS = 7

export async function getCurrentEffectiveTos(now = new Date()) {
  return drizzleClient.query.tosVersion.findFirst({
    where: (t, { lte }) => lte(t.effectiveFrom, now),
    orderBy: (t, { desc }) => [desc(t.effectiveFrom)],
  })
}

async function getUserTosState(userId: string, tosVersionId: string) {
  return drizzleClient.query.tosUserState.findFirst({
    where: (s, { and, eq }) => and(eq(s.userId, userId), eq(s.tosVersionId, tosVersionId)),
  })
}

async function ensureUserTosState({
  userId,
  tos,
  now = new Date(),
}: {
  userId: string
  tos: { id: string; graceDays?: number | null }
  now?: Date
}) {
  const existing = await getUserTosState(userId, tos.id)
  if (existing) return existing

  const graceDays = tos.graceDays ?? TOS_GRACE_DAYS
  const graceUntil = new Date(now.getTime() + graceDays * ONE_DAY_MS)

  const inserted = await drizzleClient
    .insert(tosUserState)
    .values({
      userId,
      tosVersionId: tos.id,
      firstSeenAt: now,
      graceUntil,
    })
    .onConflictDoNothing()
    .returning()

  return inserted[0] ?? (await getUserTosState(userId, tos.id))
}

export async function markTosAccepted({
  userId,
  tosId,
  now = new Date(),
  graceDays = TOS_GRACE_DAYS,
}: {
  userId: string
  tosId: string
  now?: Date
  graceDays?: number
}) {
  const graceUntil = new Date(now.getTime() + graceDays * ONE_DAY_MS)

  await drizzleClient
    .insert(tosUserState)
    .values({
      userId,
      tosVersionId: tosId,
      firstSeenAt: now,
      graceUntil,
      acceptedAt: now,
    })
    .onConflictDoUpdate({
      target: [tosUserState.userId, tosUserState.tosVersionId],
      set: { acceptedAt: now },
    })
}

export async function getTosRequirementForUser(userId: string, now = new Date()) {
  const current = await getCurrentEffectiveTos(now)
  if (!current) {
    return { tos: null, accepted: true, inGrace: false, mustBlock: false, graceUntil: null }
  }

  const state = await ensureUserTosState({
    userId,
    tos: { id: current.id, graceDays: (current as any).graceDays },
    now,
  })

  const accepted = !!state?.acceptedAt
  const graceUntil = state?.graceUntil ?? null
  const inGrace = !accepted && !!graceUntil && now <= new Date(graceUntil)

  const mustBlock = !accepted && !inGrace

  return { tos: current, accepted, inGrace, mustBlock, graceUntil }
}