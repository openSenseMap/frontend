import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { tosVersion } from '../app/schema/tos'
import { envDBSchema } from './env-schema'

type SeedTosOptions = {
  version?: string
  title?: string
  body?: string
  effectiveFrom?: Date
  acceptBy?: Date
}

export async function seedTos(
  db: PostgresJsDatabase<any>,
  options: SeedTosOptions = {},
) {
  const now = new Date()

  const effectiveFrom =
    options.effectiveFrom ?? new Date('2026-01-01T00:00:00.000Z')
  const acceptBy =
    options.acceptBy ?? new Date('2026-02-01T00:00:00.000Z')

  await db
    .insert(tosVersion)
    .values({
      version: options.version ?? '2026-01',
      title: options.title ?? 'Terms of Service',
      body:
        options.body ??
        `
# Terms of Service

By creating an account or using this service, you agree to these Terms of Service.

## Acceptable Use
You agree not to misuse the service or interfere with its normal operation.

## Accounts
You are responsible for maintaining the security of your account.

## Data
We may process data required to provide and improve the service.

## Changes
We may update these terms from time to time.
        `.trim(),
      effectiveFrom,
      acceptBy,
      updatedAt: now,
    })
    .onConflictDoNothing()
}

async function main() {
  console.log(`📄 setting up drizzle client to ${envDBSchema.DATABASE_URL}`)

  const queryClient = postgres(envDBSchema.DATABASE_URL, {
    max: 1,
    ssl: envDBSchema.PG_CLIENT_SSL === 'true' ? true : false,
  })

  const db = drizzle(queryClient)

  try {
    await seedTos(db)
  } finally {
    await queryClient.end({ timeout: 5 })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}