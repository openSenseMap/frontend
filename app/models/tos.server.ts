import { drizzleClient } from '~/db.server'
import { tosUserState } from '~/schema/tos'

export async function getCurrentEffectiveTos(now = new Date()) {
  return drizzleClient.query.tosVersion.findFirst({
    where: (t, { lte }) => lte(t.effectiveFrom, now),
    orderBy: (t, { desc }) => [desc(t.effectiveFrom)],
  })
}

async function getUserAcceptance(userId: string, tosVersionId: string) {
  return drizzleClient.query.tosUserState.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.userId, userId), eq(s.tosVersionId, tosVersionId)),
    columns: { acceptedAt: true },
  })
}

export async function markTosAccepted({
  userId,
  tosId,
  now = new Date(),
}: {
  userId: string
  tosId: string
  now?: Date
}) {
  await drizzleClient
    .insert(tosUserState)
    .values({
      userId,
      tosVersionId: tosId,
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
    return {
      tos: null,
      accepted: true,
      inGrace: false,
      mustBlock: false,
      acceptBy: null as Date | null,
    }
  }

  const state = await getUserAcceptance(userId, current.id)
  const accepted = !!state?.acceptedAt

  const acceptBy = new Date(current.acceptBy)
  const inGrace = !accepted && now < acceptBy
  const mustBlock = !accepted && now >= acceptBy

  return { tos: current, accepted, inGrace, mustBlock, acceptBy }
}