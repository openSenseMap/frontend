import { createHash, randomBytes } from 'node:crypto'
import { drizzleClient } from '~/db.server'
import { actionToken } from '~/schema'

export function generateRawActionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashActionToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

const EMAIL_CONFIRMATION_TTL_MS = 24 * 3600000//* ONE_HOUR_MILLIS

export async function issueEmailConfirmationToken(userId: string) {
  const rawToken = generateRawActionToken()
  const tokenHash = hashActionToken(rawToken)

  await drizzleClient
    .insert(actionToken)
    .values({
      userId,
      purpose: 'email_confirmation',
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_CONFIRMATION_TTL_MS),
      consumedAt: null,
    })
    .onConflictDoUpdate({
      target: [actionToken.userId, actionToken.purpose],
      set: {
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_CONFIRMATION_TTL_MS),
        consumedAt: null,
      },
    })

  return rawToken
}