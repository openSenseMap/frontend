import { createHash } from 'node:crypto'
import { z } from 'zod'
import { type CliOptions } from './cli'
import { PHASES, type MigrationConfig, type Phase } from './types'

const optionalUrl = z.string().url().optional()

const environmentSchema = z.object({
	MONGO_URL: z.string().min(1),
	MONGO_DB_NAME: z.string().min(1).default('OSeM-api'),
	MIGRATION_SOURCE_KIND: z
		.enum(['restored-backup', 'production-readonly'])
		.optional(),
	MIGRATION_BACKUP_ID: z.string().min(1).optional(),
	APP_DATABASE_URL: optionalUrl,
	DATABASE_URL: optionalUrl,
	MQTT_DATABASE_URL: optionalUrl,
	TTN_DATABASE_URL: optionalUrl,
	PG_CLIENT_SSL: z.enum(['true', 'false']).default('false'),
	MIGRATION_FROM: z.string().optional(),
	MIGRATION_HISTORY_MONTHS: z.coerce.number().int().positive().optional(),
	MIGRATION_TO: z.string().optional(),
	MIGRATION_RUN_ID: z.string().optional(),
	MIGRATION_BATCH_SIZE: z.coerce.number().int().positive().default(1000),
	MIGRATION_WRITE_FREEZE_CONFIRMED: z.enum(['true', 'false']).default('false'),
	MIGRATION_MANAGE_JOBS: z.enum(['true', 'false']).default('true'),
	MIGRATION_REFRESH_AGGREGATES: z.enum(['true', 'false']).default('true'),
	MIGRATION_API_KEY_MODE: z.enum(['preserve', 'rotate']).default('preserve'),
	MIGRATION_PHASES: z.string().optional(),
	MIGRATION_REPORT_DIR: z.string().min(1).default('migration-reports'),
	LEGACY_IMAGE_DIR: z.string().optional(),
	S3_ENDPOINT: optionalUrl,
	S3_REGION: z.string().optional(),
	S3_BUCKET: z.string().optional(),
	S3_ACCESS_KEY: z.string().optional(),
	S3_SECRET_KEY: z.string().optional(),
	S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('true'),
})

function parseDate(value: string | undefined, name: string) {
	if (!value) throw new Error(`${name} is required`)
	const date = new Date(value)
	if (!Number.isFinite(date.getTime())) throw new Error(`${name} is invalid`)
	if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
		throw new Error(`${name} must include Z or an explicit UTC offset`)
	}
	return date
}

function parseEnvironmentPhases(
	value: string | undefined,
): Phase[] | undefined {
	if (!value) return undefined
	if (value === 'all') return [...PHASES]
	const values = value.split(',').map((item) => item.trim())
	for (const phase of values) {
		if (!PHASES.includes(phase as Phase)) {
			throw new Error(`MIGRATION_PHASES contains unknown phase: ${phase}`)
		}
	}
	return [...new Set(values as Phase[])]
}

export function subtractUtcMonths(date: Date, months: number) {
	const result = new Date(date)
	const day = result.getUTCDate()
	result.setUTCDate(1)
	result.setUTCMonth(result.getUTCMonth() - months)
	const lastDay = new Date(
		Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
	).getUTCDate()
	result.setUTCDate(Math.min(day, lastDay))
	return result
}

export function parseConfig(
	environment: NodeJS.ProcessEnv,
	cli: CliOptions,
): MigrationConfig {
	const parsed = environmentSchema.parse(environment)
	const phases = cli.phases ??
		parseEnvironmentPhases(parsed.MIGRATION_PHASES) ?? [...PHASES]
	if (!parsed.MIGRATION_SOURCE_KIND) {
		throw new Error(
			'MIGRATION_SOURCE_KIND is required (restored-backup or production-readonly)',
		)
	}
	if (parsed.MIGRATION_SOURCE_KIND === 'restored-backup') {
		if (!parsed.MIGRATION_BACKUP_ID) {
			throw new Error(
				'MIGRATION_BACKUP_ID is required for a restored-backup source',
			)
		}
	} else if (!cli.dryRun || phases.length !== 1 || phases[0] !== 'preflight') {
		throw new Error(
			'production-readonly sources are limited to --dry-run --phase preflight; data imports must use a restored backup',
		)
	}
	const to = parseDate(cli.to ?? parsed.MIGRATION_TO, 'MIGRATION_TO/--to')
	let from: Date
	if (cli.from !== undefined || cli.historyMonths !== undefined) {
		if (cli.from !== undefined && cli.historyMonths !== undefined) {
			throw new Error('--from and --history-months are mutually exclusive')
		}
		from = cli.from
			? parseDate(cli.from, 'MIGRATION_FROM/--from')
			: subtractUtcMonths(to, cli.historyMonths!)
	} else {
		if (
			parsed.MIGRATION_FROM !== undefined &&
			parsed.MIGRATION_HISTORY_MONTHS !== undefined
		) {
			throw new Error(
				'MIGRATION_FROM and MIGRATION_HISTORY_MONTHS are mutually exclusive',
			)
		}
		if (parsed.MIGRATION_FROM !== undefined) {
			from = parseDate(parsed.MIGRATION_FROM, 'MIGRATION_FROM/--from')
		} else if (parsed.MIGRATION_HISTORY_MONTHS !== undefined) {
			from = subtractUtcMonths(to, parsed.MIGRATION_HISTORY_MONTHS)
		} else {
			throw new Error(
				'MIGRATION_FROM/--from or MIGRATION_HISTORY_MONTHS/--history-months is required',
			)
		}
	}
	if (from >= to) throw new Error('Migration window must satisfy from < to')
	const archiveBefore = subtractUtcMonths(to, 12)
	if (from > archiveBefore) {
		throw new Error(
			'Migration must include at least 12 months so device archival is calculated from the complete retention window',
		)
	}

	const appDatabaseUrl = parsed.APP_DATABASE_URL ?? parsed.DATABASE_URL
	if (!appDatabaseUrl) {
		throw new Error('APP_DATABASE_URL or DATABASE_URL is required')
	}

	if (!parsed.MQTT_DATABASE_URL || !parsed.TTN_DATABASE_URL) {
		throw new Error(
			'MQTT_DATABASE_URL and TTN_DATABASE_URL are required for every run',
		)
	}

	const requiredMedia = [
		parsed.S3_ENDPOINT,
		parsed.S3_REGION,
		parsed.S3_BUCKET,
		parsed.S3_ACCESS_KEY,
		parsed.S3_SECRET_KEY,
		parsed.LEGACY_IMAGE_DIR,
	]
	if (requiredMedia.some((value) => !value)) {
		throw new Error(
			'LEGACY_IMAGE_DIR and all S3_* variables are required for every run',
		)
	}
	const s3: NonNullable<MigrationConfig['s3']> = {
		endpoint: parsed.S3_ENDPOINT!,
		region: parsed.S3_REGION!,
		bucket: parsed.S3_BUCKET!,
		accessKey: parsed.S3_ACCESS_KEY!,
		secretKey: parsed.S3_SECRET_KEY!,
		forcePathStyle: parsed.S3_FORCE_PATH_STYLE === 'true',
	}

	const runId =
		cli.runId ??
		parsed.MIGRATION_RUN_ID ??
		`osem-vnext-${to.toISOString().replaceAll(/[^0-9A-Za-z]/g, '-')}`
	if (!/^[0-9A-Za-z._-]+$/.test(runId)) {
		throw new Error(
			'Migration run ID may only contain letters, digits, ., _, and -',
		)
	}
	const refreshAggregates =
		cli.refreshAggregates ?? parsed.MIGRATION_REFRESH_AGGREGATES === 'true'
	const apiKeyMode = cli.apiKeyMode ?? parsed.MIGRATION_API_KEY_MODE
	const batchSize = cli.batchSize ?? parsed.MIGRATION_BATCH_SIZE
	if (batchSize > 10_000) {
		throw new Error('Migration batch size must not exceed 10000')
	}

	return {
		runId,
		phases,
		dryRun: cli.dryRun,
		sourceKind: parsed.MIGRATION_SOURCE_KIND,
		backupId: parsed.MIGRATION_BACKUP_ID,
		from,
		to,
		archiveBefore,
		batchSize,
		writeFreezeConfirmed:
			cli.confirmWriteFreeze ||
			parsed.MIGRATION_WRITE_FREEZE_CONFIRMED === 'true',
		manageJobs: cli.manageJobs ?? parsed.MIGRATION_MANAGE_JOBS === 'true',
		refreshAggregates,
		apiKeyMode,
		mongoUrl: parsed.MONGO_URL,
		mongoDbName: parsed.MONGO_DB_NAME,
		appDatabaseUrl,
		mqttDatabaseUrl: parsed.MQTT_DATABASE_URL,
		ttnDatabaseUrl: parsed.TTN_DATABASE_URL,
		pgSsl: parsed.PG_CLIENT_SSL === 'true',
		legacyImageDirectory: parsed.LEGACY_IMAGE_DIR,
		s3,
		reportDirectory: parsed.MIGRATION_REPORT_DIR,
	}
}

export function redactedConfigHash(config: MigrationConfig) {
	const identity = (value: string | undefined) => {
		if (!value) return null
		const url = new URL(value)
		return `${url.protocol}//${url.host}${url.pathname}`
	}
	const structural = {
		from: config.from.toISOString(),
		to: config.to.toISOString(),
		archiveBefore: config.archiveBefore.toISOString(),
		manageJobs: config.manageJobs,
		refreshAggregates: config.refreshAggregates,
		apiKeyMode: config.apiKeyMode,
		sourceKind: config.sourceKind,
		backupId: config.backupId ?? null,
		mongoDbName: config.mongoDbName,
		mongo: identity(config.mongoUrl),
		app: identity(config.appDatabaseUrl),
		mqtt: identity(config.mqttDatabaseUrl),
		ttn: identity(config.ttnDatabaseUrl),
		s3: identity(config.s3?.endpoint),
		s3Bucket: config.s3?.bucket ?? null,
		legacyImageDirectory: config.legacyImageDirectory ?? null,
	}
	return createHash('sha256').update(JSON.stringify(structural)).digest('hex')
}
