import { drizzleClient } from '~/db.server'

export async function getCurrentEffectiveTos(now = new Date()) {
  return drizzleClient.query.tosVersion.findFirst({
    where: (t, { lte }) => lte(t.effectiveAt, now),
    orderBy: (t, { desc }) => [desc(t.effectiveAt)],
  })
}

export async function hasAcceptedTos(userId: string, tosVersionId: string) {
  const row = await drizzleClient.query.tosAcceptance.findFirst({
    where: (a, { and, eq }) => and(eq(a.userId, userId), eq(a.tosVersionId, tosVersionId)),
  })
  return !!row
}

export async function getTosRequirementForUser(userId: string) {
  const current = await getCurrentEffectiveTos()
  if (!current) return { required: false as const, tos: null }

  const accepted = await hasAcceptedTos(userId, current.id)
  return { required: !accepted, tos: current }
}