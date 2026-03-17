import { createHash, randomBytes } from 'node:crypto'

export function generateRawActionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashActionToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}