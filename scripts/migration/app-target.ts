import postgres, {
	type JSONValue,
	type Sql,
	type TransactionSql,
} from 'postgres'
import { canonicalValue } from './canonical'
import {
	type MigratedDevice,
	type MigratedMeasurement,
	type MigratedUser,
	type MigrationConfig,
	type PausedJob,
	type Phase,
	type PhaseProgress,
	type PhaseResult,
	type Rejection,
} from './types'

const SCRIPT_VERSION = '0.6.0'
export const ORPHAN_USER_ID = 'system_orphan_user'

const MIGRATION_CAGGS = [
	'measurement_10min',
	'measurement_1hour',
	'measurement_1day',
	'measurement_1month',
	'measurement_1year',
] as const

const REQUIRED_BACKGROUND_JOB_NAMES = [
	'policy_retention:measurement',
	...MIGRATION_CAGGS.flatMap((view) => [
		`policy_refresh_continuous_aggregate:${view}`,
		`policy_retention:${view}`,
	]),
	'delete-temporary-devices',
	'cleanup_expired_tos_users',
]

const BACKGROUND_JOB_IDLE_TIMEOUT_MS = 5 * 60 * 1_000

type TimescaleJobCatalogRow = {
	jobId: number
	procName: string
	hypertableSchema: string | null
	hypertableName: string | null
	scheduled: boolean
}

type ContinuousAggregateCatalogRow = {
	viewSchema: string
	viewName: string
	materializationSchema: string
	materializationName: string
}

type DiscoveredTimescaleJob = {
	jobId: number
	name: string
	scheduled: boolean
}

/** Builds an unambiguous schema-qualified lookup key for Timescale catalog objects. */
function catalogIdentity(schema: string | null, name: string | null) {
	return schema && name ? `${schema}\0${name}` : null
}

/**
 * Maps physical Timescale hypertable/materialization jobs to stable logical names
 * used by migration job-management checks.
 */
export function discoverTimescaleJobs(
	jobs: TimescaleJobCatalogRow[],
	aggregates: ContinuousAggregateCatalogRow[],
): DiscoveredTimescaleJob[] {
	const logicalNames = new Map<string, string>([
		[catalogIdentity('public', 'measurement')!, 'measurement'],
	])
	for (const aggregate of aggregates) {
		logicalNames.set(
			catalogIdentity(aggregate.viewSchema, aggregate.viewName)!,
			aggregate.viewName,
		)
		logicalNames.set(
			catalogIdentity(
				aggregate.materializationSchema,
				aggregate.materializationName,
			)!,
			aggregate.viewName,
		)
	}

	return jobs.flatMap((job) => {
		const identity = catalogIdentity(job.hypertableSchema, job.hypertableName)
		const logicalName = identity ? logicalNames.get(identity) : undefined
		return logicalName
			? [
					{
						jobId: job.jobId,
						name: `${job.procName}:${logicalName}`,
						scheduled: job.scheduled,
					},
				]
			: []
	})
}

type SqlClient = Sql<Record<string, unknown>>
type TransactionClient = TransactionSql<Record<string, unknown>>
type QueryClient = SqlClient | TransactionClient

/** Narrows already-sanitized migration metadata to the PostgreSQL client's JSON type. */
function json(value: unknown): JSONValue {
	return value as JSONValue
}

/** Creates a UTC, public-schema PostgreSQL pool with predictable migration settings. */
function postgresClient(url: string, ssl: boolean, max = 5) {
	return postgres(url, {
		ssl,
		max,
		connect_timeout: 120,
		connection: {
			application_name: 'opensensemap-vnext-migration',
			options:
				'-c timezone=UTC -c search_path=public -c max_parallel_workers_per_gather=0',
		},
	})
}

export class AppTarget {
	readonly sql: SqlClient
	private readonly locationIds = new Map<string, string>()

	/** Opens the application-target client; dry-run mode suppresses every write method. */
	constructor(
		url: string,
		ssl: boolean,
		private readonly dryRun: boolean,
	) {
		this.sql = postgresClient(url, ssl)
	}

	/** Fails early if the target database cannot accept a simple query. */
	async connect() {
		await this.sql`SELECT 1`
	}

	/** Gracefully drains the target connection pool at the end of the command. */
	async close() {
		await this.sql.end({ timeout: 10 })
	}

	/**
	 * Holds a session-level advisory lock so two migration processes cannot write the
	 * application target concurrently; the returned callback releases that session.
	 */
	async acquireLock() {
		const connection = await this.sql.reserve()
		const [result] = await connection<[{ locked: boolean }]>`
			SELECT pg_try_advisory_lock(hashtext('opensensemap-vnext-data-migration')) AS locked
		`
		if (!result.locked) {
			await connection.release()
			throw new Error(
				'Another openSenseMap data migration holds the advisory lock',
			)
		}
		return async () => {
			await connection`SELECT pg_advisory_unlock(hashtext('opensensemap-vnext-data-migration'))`
			await connection.release()
		}
	}

	/**
	 * Reads the database version, extensions, schema contract, aggregates, ToS, and
	 * integration registry consumed by runner preflight.
	 */
	async inspect(cutoff: Date) {
		const [version] = await this.sql<[{ version: string; major: number }]>`
			SELECT current_setting('server_version') AS version,
			       current_setting('server_version_num')::int / 10000 AS major
		`
		const extensions = await this.sql<
			{ extname: string; extversion: string }[]
		>`
			SELECT extname, extversion
			FROM pg_extension
			WHERE extname IN ('timescaledb', 'timescaledb_toolkit', 'postgis', 'pg_cron')
			ORDER BY extname
		`
		const [contract] = await this.sql<
			[
				{
					userTable: boolean
					deviceTable: boolean
					measurementTable: boolean
					integrationTable: boolean
					percentileAgg: boolean
					hypertable: boolean
				},
			]
		>`
			SELECT
				to_regclass('public.user') IS NOT NULL AS "userTable",
				to_regclass('public.device') IS NOT NULL AS "deviceTable",
				to_regclass('public.measurement') IS NOT NULL AS "measurementTable",
				to_regclass('public.integration') IS NOT NULL AS "integrationTable",
				to_regprocedure('percentile_agg(double precision)') IS NOT NULL AS "percentileAgg",
				EXISTS (
					SELECT 1 FROM timescaledb_information.hypertables
					WHERE hypertable_schema = 'public' AND hypertable_name = 'measurement'
				) AS hypertable
		`
		const columns = await this.sql<Array<{ name: string }>>`
			SELECT table_name || '.' || column_name AS name
			FROM information_schema.columns
			WHERE table_schema = 'public'
			  AND table_name IN (
				'user', 'password', 'profile', 'location', 'device',
				'device_to_location', 'sensor', 'measurement', 'integration',
				'tos_version', 'tos_user_state'
			  )
		`
		const enumRows = await this.sql<Array<{ name: string; values: string[] }>>`
			SELECT t.typname AS name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
			FROM pg_type t
			JOIN pg_namespace n ON n.oid = t.typnamespace
			JOIN pg_enum e ON e.enumtypid = t.oid
			WHERE n.nspname = 'public' AND t.typname IN ('model', 'exposure', 'status')
			GROUP BY t.typname
		`
		const aggregateRows = await this.sql<
			Array<{
				viewName: string
				materializedOnly: boolean
				materializationSchema: string
				materializationName: string
			}>
		>`
			SELECT view_name AS "viewName",
				materialized_only AS "materializedOnly",
				materialization_hypertable_schema AS "materializationSchema",
				materialization_hypertable_name AS "materializationName"
			FROM timescaledb_information.continuous_aggregates
			WHERE view_schema = 'public'
			ORDER BY view_name
		`
		const [tos] = await this.sql<
			Array<{ id: string; effectiveFrom: Date; acceptBy: Date }>
		>`
			SELECT id, effective_from AS "effectiveFrom", accept_by AS "acceptBy"
			FROM tos_version
			WHERE effective_from <= ${cutoff}
			ORDER BY effective_from DESC
			LIMIT 1
		`
		const integrations = await this.sql<
			Array<{ slug: string; configured: boolean }>
		>`
			SELECT slug,
				btrim(service_url) <> '' AND btrim(service_key) <> '' AS configured
			FROM integration
			WHERE slug IN ('mqtt', 'ttn')
			ORDER BY slug
		`

		return {
			version,
			extensions,
			contract,
			columns: columns.map((row) => row.name),
			enums: Object.fromEntries(enumRows.map((row) => [row.name, row.values])),
			continuousAggregates: aggregateRows.map((row) => row.viewName),
			continuousAggregateDetails: aggregateRows,
			currentTos: tos ?? null,
			integrations,
		}
	}

	/**
	 * Idempotently creates the migration journal, checkpoints, manifests, entity sets,
	 * rejection log, and media audit tables. It never runs during a dry run.
	 */
	async ensureControlSchema() {
		if (this.dryRun) return
		await this.sql.begin(async (tx) => {
			await tx`CREATE SCHEMA IF NOT EXISTS osem_migration`
			await tx`
				CREATE TABLE IF NOT EXISTS osem_migration.run (
					id text PRIMARY KEY,
					script_version text NOT NULL,
					source_fingerprint jsonb NOT NULL,
					config_hash text NOT NULL,
					from_time timestamptz NOT NULL,
					to_time timestamptz NOT NULL,
					archive_before timestamptz NOT NULL,
					status text NOT NULL CHECK (status IN ('running', 'failed', 'completed')),
					paused_jobs jsonb NOT NULL DEFAULT '[]'::jsonb,
					jobs_state text NOT NULL DEFAULT 'none',
					resume_count integer NOT NULL DEFAULT 0,
					last_resumed_at timestamptz,
					started_at timestamptz NOT NULL DEFAULT now(),
					updated_at timestamptz NOT NULL DEFAULT now(),
					completed_at timestamptz,
					CHECK (from_time < to_time)
				)
			`
			await tx`
				ALTER TABLE osem_migration.run
				ADD COLUMN IF NOT EXISTS jobs_state text NOT NULL DEFAULT 'none'
			`
			await tx`
				ALTER TABLE osem_migration.run
				ADD COLUMN IF NOT EXISTS resume_count integer NOT NULL DEFAULT 0
			`
			await tx`
				ALTER TABLE osem_migration.run
				ADD COLUMN IF NOT EXISTS last_resumed_at timestamptz
			`
			await tx`
				CREATE UNIQUE INDEX IF NOT EXISTS osem_migration_one_running
				ON osem_migration.run ((1)) WHERE status = 'running'
			`
			await tx`
				CREATE TABLE IF NOT EXISTS osem_migration.rejection (
					id bigserial PRIMARY KEY,
					run_id text NOT NULL REFERENCES osem_migration.run(id) ON DELETE CASCADE,
					phase text NOT NULL,
					source_collection text NOT NULL,
					source_id text NOT NULL DEFAULT '',
					code text NOT NULL,
					safe_details jsonb NOT NULL DEFAULT '{}'::jsonb,
					created_at timestamptz NOT NULL DEFAULT now(),
					UNIQUE (run_id, phase, source_collection, source_id, code)
				)
			`
			await tx`
				CREATE TABLE IF NOT EXISTS osem_migration.manifest (
					run_id text NOT NULL REFERENCES osem_migration.run(id) ON DELETE CASCADE,
					entity text NOT NULL,
					partition_key text NOT NULL DEFAULT '',
					expected_count bigint NOT NULL,
					source_sha256 text,
					target_count bigint,
					target_sha256 text,
					details jsonb NOT NULL DEFAULT '{}'::jsonb,
					PRIMARY KEY (run_id, entity, partition_key)
				)
			`
			await tx`
				ALTER TABLE osem_migration.manifest
				ADD COLUMN IF NOT EXISTS source_sha256 text
			`
			await tx`
				ALTER TABLE osem_migration.manifest
				ADD COLUMN IF NOT EXISTS target_sha256 text
			`
			await tx`
				CREATE TABLE IF NOT EXISTS osem_migration.entity (
					run_id text NOT NULL REFERENCES osem_migration.run(id) ON DELETE CASCADE,
					entity text NOT NULL,
					source_id text NOT NULL,
					PRIMARY KEY (run_id, entity, source_id)
				)
			`
			await tx`
				CREATE TABLE IF NOT EXISTS osem_migration.asset (
					run_id text NOT NULL REFERENCES osem_migration.run(id) ON DELETE CASCADE,
					source_path text NOT NULL,
					device_id text NOT NULL,
					target_bucket text NOT NULL,
					target_key text NOT NULL,
					sha256 text NOT NULL,
					bytes bigint NOT NULL,
					status text NOT NULL,
					etag text,
					safe_error jsonb,
					updated_at timestamptz NOT NULL DEFAULT now(),
					PRIMARY KEY (run_id, source_path)
				)
			`
			await tx`
				CREATE TABLE IF NOT EXISTS osem_migration.phase_progress (
					run_id text NOT NULL REFERENCES osem_migration.run(id) ON DELETE CASCADE,
					phase text NOT NULL,
					status text NOT NULL CHECK (status IN ('running', 'completed')),
					source_seen bigint NOT NULL DEFAULT 0 CHECK (source_seen >= 0),
					written bigint NOT NULL DEFAULT 0 CHECK (written >= 0),
					skipped bigint NOT NULL DEFAULT 0 CHECK (skipped >= 0),
					rejected bigint NOT NULL DEFAULT 0 CHECK (rejected >= 0),
					cursor jsonb,
					updated_at timestamptz NOT NULL DEFAULT now(),
					completed_at timestamptz,
					PRIMARY KEY (run_id, phase)
				)
			`
		})
	}

	/**
	 * Creates a new run journal or reopens a failed/interrupted run only when script,
	 * redacted configuration, and source fingerprint still match exactly.
	 */
	async beginRun(
		config: MigrationConfig,
		configHash: string,
		sourceFingerprint: Record<string, unknown>,
	) {
		if (this.dryRun) return
		const [existing] = await this.sql<
			Array<{
				id: string
				status: 'running' | 'failed' | 'completed'
				scriptVersion: string
				configHash: string
				sourceFingerprint: Record<string, unknown>
			}>
		>`
			SELECT id, status, script_version AS "scriptVersion",
				config_hash AS "configHash",
				source_fingerprint AS "sourceFingerprint"
			FROM osem_migration.run WHERE id = ${config.runId}
		`
		if (config.resume) {
			if (!existing) {
				throw new Error(`Cannot resume unknown migration run ${config.runId}`)
			}
			if (existing.status === 'completed') {
				throw new Error(`Migration run ${config.runId} is already completed`)
			}
			if (existing.scriptVersion !== SCRIPT_VERSION) {
				throw new Error(
					`Resume script version ${SCRIPT_VERSION} does not match original ${existing.scriptVersion}`,
				)
			}
			if (existing.configHash !== configHash) {
				throw new Error(
					'Resume configuration does not match the original migration run',
				)
			}
			if (
				canonicalValue(existing.sourceFingerprint) !==
				canonicalValue(sourceFingerprint)
			) {
				throw new Error(
					'Resume source fingerprint does not match the original migration run',
				)
			}
			await this.sql`
				UPDATE osem_migration.run
				SET status = 'running', resume_count = resume_count + 1,
					last_resumed_at = now(), updated_at = now(), completed_at = NULL
				WHERE id = ${config.runId}
			`
			return
		}
		if (existing) {
			throw new Error(
				`Run ${config.runId} already exists; use --resume only for a verified incomplete run`,
			)
		}
		await this.sql`
			INSERT INTO osem_migration.run (
				id, script_version, source_fingerprint, config_hash,
				from_time, to_time, archive_before, status
			) VALUES (
				${config.runId}, ${SCRIPT_VERSION}, ${this.sql.json(json(sourceFingerprint))},
				${configHash}, ${config.from}, ${config.to}, ${config.archiveBefore}, 'running'
			)
		`
	}

	/** Records, in bounded batches, the exact source IDs owned by this migration run. */
	async recordEntityIds(runId: string, entity: string, sourceIds: string[]) {
		if (this.dryRun || sourceIds.length === 0) return
		for (let offset = 0; offset < sourceIds.length; offset += 5_000) {
			const rows = sourceIds.slice(offset, offset + 5_000).map((sourceId) => ({
				run_id: runId,
				entity,
				source_id: sourceId,
			}))
			await this.sql`
				INSERT INTO osem_migration.entity ${this.sql(
					rows,
					'run_id',
					'entity',
					'source_id',
				)}
				ON CONFLICT (run_id, entity, source_id) DO NOTHING
			`
		}
	}

	/** Loads durable phase counters and cursor state, or null when no phase began. */
	async phaseProgress(runId: string, phase: Phase) {
		if (this.dryRun) return null
		const [row] = await this.sql<
			Array<{
				phase: Phase
				status: 'running' | 'completed'
				sourceSeen: string
				written: string
				skipped: string
				rejected: string
				cursor: Record<string, unknown> | null
			}>
		>`
			SELECT phase, status, source_seen::text AS "sourceSeen",
				written::text, skipped::text, rejected::text, cursor
			FROM osem_migration.phase_progress
			WHERE run_id = ${runId} AND phase = ${phase}
		`
		return row
			? ({
					phase: row.phase,
					status: row.status,
					sourceSeen: Number(row.sourceSeen),
					written: Number(row.written),
					skipped: Number(row.skipped),
					rejected: Number(row.rejected),
					cursor: row.cursor,
				} satisfies PhaseProgress)
			: null
	}

	/**
	 * Atomically upserts the latest phase totals and cursor, optionally on the same
	 * transaction client as the data write that the checkpoint describes.
	 */
	async savePhaseProgress(
		runId: string,
		result: PhaseResult,
		status: 'running' | 'completed',
		cursor: Record<string, unknown> | null,
		client: QueryClient = this.sql,
	) {
		if (this.dryRun) return
		await client`
			INSERT INTO osem_migration.phase_progress (
				run_id, phase, status, source_seen, written, skipped, rejected,
				cursor, completed_at
			) VALUES (
				${runId}, ${result.phase}, ${status}, ${result.sourceSeen},
				${result.written}, ${result.skipped}, ${result.rejected},
				${cursor ? client.json(json(cursor)) : null},
				${status === 'completed' ? new Date() : null}
			)
			ON CONFLICT (run_id, phase) DO UPDATE SET
				status = excluded.status,
				source_seen = excluded.source_seen,
				written = excluded.written,
				skipped = excluded.skipped,
				rejected = excluded.rejected,
				cursor = excluded.cursor,
				updated_at = now(),
				completed_at = excluded.completed_at
		`
	}

	/**
	 * Protects a fresh run from mixing with existing application data while permitting
	 * only a correctly shaped, unauthenticated reserved orphan user.
	 */
	async assertTargetEmpty() {
		const orphanRows = await this.sql<
			Array<{ id: string; name: string; email: string; role: string | null }>
		>`
			SELECT id, name, email, role FROM "user"
			WHERE id = ${ORPHAN_USER_ID}
			   OR name = 'Orphaned Devices'
			   OR email = 'orphaned@opensensemap.org'
		`
		for (const row of orphanRows) {
			if (
				row.id !== ORPHAN_USER_ID ||
				row.name !== 'Orphaned Devices' ||
				row.email !== 'orphaned@opensensemap.org' ||
				row.role !== 'user'
			) {
				throw new Error(
					'Reserved orphan-user identity collides with target data',
				)
			}
		}
		const [orphanAuth] = await this.sql<[{ count: string }]>`
			SELECT (
				(SELECT count(*) FROM password WHERE user_id = ${ORPHAN_USER_ID}) +
				(SELECT count(*) FROM profile WHERE user_id = ${ORPHAN_USER_ID})
			)::text AS count
		`
		if (orphanAuth.count !== '0') {
			throw new Error(
				'Reserved orphan user must not have a password or profile',
			)
		}

		type TargetCounts = {
			users: string
			devices: string
			sensors: string
			measurements: string
		}
		const [counts] = await this.sql<Array<TargetCounts>>`
			SELECT
				(SELECT count(*) FROM "user" WHERE id <> ${ORPHAN_USER_ID})::text AS users,
				(SELECT count(*) FROM device)::text AS devices,
				(SELECT count(*) FROM sensor)::text AS sensors,
				(SELECT count(*) FROM measurement)::text AS measurements
		`
		const unexpected = Object.entries(counts).filter(
			([, value]) => value !== '0',
		)
		if (unexpected.length > 0) {
			throw new Error(
				`Target App database is not empty: ${unexpected
					.map(([name, count]) => `${name}=${count}`)
					.join(', ')}`,
			)
		}
	}

	/**
	 * Rejects resume when target rows fall outside this run's recorded entities or
	 * measurement window, preventing accidental adoption of unrelated data.
	 */
	async assertResumeTarget(runId: string, from: Date, to: Date) {
		const orphanRows = await this.sql<
			Array<{ id: string; name: string; email: string; role: string | null }>
		>`
			SELECT id, name, email, role FROM "user"
			WHERE id = ${ORPHAN_USER_ID}
			   OR name = 'Orphaned Devices'
			   OR email = 'orphaned@opensensemap.org'
		`
		for (const row of orphanRows) {
			if (
				row.id !== ORPHAN_USER_ID ||
				row.name !== 'Orphaned Devices' ||
				row.email !== 'orphaned@opensensemap.org' ||
				row.role !== 'user'
			) {
				throw new Error(
					'Reserved orphan-user identity collides with target data',
				)
			}
		}
		const [orphanAuth] = await this.sql<[{ count: string }]>`
			SELECT (
				(SELECT count(*) FROM password WHERE user_id = ${ORPHAN_USER_ID}) +
				(SELECT count(*) FROM profile WHERE user_id = ${ORPHAN_USER_ID})
			)::text AS count
		`
		if (orphanAuth.count !== '0') {
			throw new Error(
				'Reserved orphan user must not have a password or profile',
			)
		}
		const [unexpected] = await this.sql<
			Array<{
				users: string
				devices: string
				sensors: string
				measurements: string
			}>
		>`
			SELECT
				(SELECT count(*)::text FROM "user" u
				 WHERE u.id <> ${ORPHAN_USER_ID} AND NOT EXISTS (
					SELECT 1 FROM osem_migration.entity e
					WHERE e.run_id = ${runId} AND e.entity = 'user' AND e.source_id = u.id
				 )) AS users,
				(SELECT count(*)::text FROM device d WHERE NOT EXISTS (
					SELECT 1 FROM osem_migration.entity e
					WHERE e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
				 )) AS devices,
				(SELECT count(*)::text FROM sensor s WHERE NOT EXISTS (
					SELECT 1 FROM osem_migration.entity e
					WHERE e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = s.id
				 )) AS sensors,
				(SELECT count(*)::text FROM measurement m WHERE
					m.time < ${from} OR m.time >= ${to} OR NOT EXISTS (
						SELECT 1 FROM osem_migration.entity e
						WHERE e.run_id = ${runId} AND e.entity = 'sensor'
						  AND e.source_id = m.sensor_id
					)
				) AS measurements
		`
		const conflicts = Object.entries(unexpected).filter(
			([, count]) => count !== '0',
		)
		if (conflicts.length > 0) {
			throw new Error(
				`Resume target contains rows outside the recorded migration: ${conflicts
					.map(([name, count]) => `${name}=${count}`)
					.join(', ')}`,
			)
		}
	}

	/** Returns coarse target counts used only as resume-safety evidence. */
	async resumeDataCounts() {
		const [counts] = await this.sql<
			Array<{
				users: string
				devices: string
				sensors: string
				measurements: string
			}>
		>`
			SELECT
				(SELECT count(*)::text FROM "user" WHERE id <> ${ORPHAN_USER_ID}) AS users,
				(SELECT count(*)::text FROM device) AS devices,
				(SELECT count(*)::text FROM sensor) AS sensors,
				(SELECT count(*)::text FROM measurement) AS measurements
		`
		return Object.fromEntries(
			Object.entries(counts).map(([key, value]) => [key, Number(value)]),
		) as Record<'users' | 'devices' | 'sensors' | 'measurements', number>
	}

	/**
	 * Detects device/sensor fields that finalize would have changed, so bootstrap does
	 * not misclassify a later interrupted state as an unfinished devices phase.
	 */
	async resumeMetadataInvariantCounts(runId: string, cutoff: Date) {
		const [counts] = await this.sql<
			Array<{ devices: string; sensors: string }>
		>`
			SELECT
				(SELECT count(*)::text FROM device d
				 JOIN osem_migration.entity e
				   ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
				 WHERE d.image IS NOT NULL OR d.website IS NOT NULL
				    OR d.status::text <> 'old' OR d.archived_at IS NOT NULL
				    OR d.device_schema_version_id IS NOT NULL
				    OR (d.user_id = ${ORPHAN_USER_ID}) IS DISTINCT FROM (d.orphaned_at IS NOT NULL)
				    OR (d.user_id = ${ORPHAN_USER_ID} AND d.orphaned_at IS DISTINCT FROM ${cutoff})
				) AS devices,
				(SELECT count(*)::text FROM sensor s
				 JOIN osem_migration.entity e
				   ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = s.id
				 WHERE s.status::text <> 'old' OR s."lastMeasurement" IS NOT NULL
				) AS sensors
		`
		return {
			devices: Number(counts.devices),
			sensors: Number(counts.sensors),
		}
	}

	/** Marks a currently running journal as failed or completed with consistent dates. */
	async finishRun(runId: string, status: 'failed' | 'completed') {
		if (this.dryRun) return
		await this.sql`
			UPDATE osem_migration.run
			SET status = ${status}, updated_at = now(),
				completed_at = CASE WHEN ${status} = 'completed' THEN now() ELSE NULL END
			WHERE id = ${runId} AND status = 'running'
		`
	}

	/** Idempotently records a safe, structured rejection without copying sensitive data. */
	async reject(
		runId: string,
		rejection: Rejection,
		client: QueryClient = this.sql,
	) {
		if (this.dryRun) return
		await client`
			INSERT INTO osem_migration.rejection (
				run_id, phase, source_collection, source_id, code, safe_details
			) VALUES (
				${runId}, ${rejection.phase}, ${rejection.sourceCollection},
				${rejection.sourceId ?? ''}, ${rejection.code},
				${client.json(json(rejection.details ?? {}))}
			)
			ON CONFLICT (run_id, phase, source_collection, source_id, code)
			DO UPDATE SET safe_details = excluded.safe_details
		`
	}

	/** Creates the reserved non-login owner for devices whose legacy owner is unavailable. */
	async ensureOrphanUser() {
		if (this.dryRun) return
		await this.sql`
			INSERT INTO "user" (
				id, name, email, role, language, email_is_confirmed,
				newsletter_opt_in, theme_preference, created_at, updated_at
			) VALUES (
				${ORPHAN_USER_ID}, 'Orphaned Devices', 'orphaned@opensensemap.org',
				'user', 'en_US', true, false, 'system', now(), now()
			)
			ON CONFLICT (id) DO NOTHING
		`
	}

	/**
	 * Inserts a user, password, and private profile in one transaction. On replay it
	 * accepts the row only when every migration-owned value still matches the source.
	 */
	async insertUser(user: MigratedUser) {
		if (this.dryRun) return 'inserted' as const
		return this.sql.begin(async (tx) => {
			const [present] = await tx<[{ exists: boolean }]>`
				SELECT EXISTS (SELECT 1 FROM "user" WHERE id = ${user.id}) AS exists
			`
			if (!present.exists) {
				await tx`
					INSERT INTO "user" (
						id, name, email, theme_preference,
						role, language, email_is_confirmed, newsletter_opt_in,
						created_at, updated_at, accepted_tos_version_id, accepted_tos_at
					) VALUES (
						${user.id}, ${user.name}, ${user.email}, 'system',
						${user.role}, ${user.language}, ${user.emailIsConfirmed}, false,
						${user.createdAt}, ${user.updatedAt}, NULL, NULL
					)
				`
				await tx`
					INSERT INTO password (user_id, hash)
					VALUES (${user.id}, ${user.passwordHash})
				`
				await tx`
					INSERT INTO profile (id, display_name, public, user_id)
					VALUES (${user.profileId}, ${user.displayName}, false, ${user.id})
				`
				return 'inserted' as const
			}

			const [actual] = await tx<
				Array<{
					name: string
					email: string
					unconfirmedEmail: string | null
					themePreference: string
					role: string | null
					language: string | null
					emailIsConfirmed: boolean | null
					newsletterOptIn: boolean
					createdAt: Date
					updatedAt: Date
					acceptedTosVersionId: string | null
					acceptedTosAt: Date | null
					passwordCount: string
					passwordHash: string | null
					profileCount: string
					profileId: string | null
					displayName: string | null
					profilePublic: boolean | null
				}>
			>`
				SELECT u.name, u.email, u.unconfirmed_email AS "unconfirmedEmail",
					u.theme_preference AS "themePreference", u.role, u.language,
					u.email_is_confirmed AS "emailIsConfirmed",
					u.newsletter_opt_in AS "newsletterOptIn",
					u.created_at AS "createdAt", u.updated_at AS "updatedAt",
					u.accepted_tos_version_id AS "acceptedTosVersionId",
					u.accepted_tos_at AS "acceptedTosAt",
					(SELECT count(*)::text FROM password WHERE user_id = u.id) AS "passwordCount",
					(SELECT max(hash) FROM password WHERE user_id = u.id) AS "passwordHash",
					(SELECT count(*)::text FROM profile WHERE user_id = u.id) AS "profileCount",
					(SELECT max(id) FROM profile WHERE user_id = u.id) AS "profileId",
					(SELECT max(display_name) FROM profile WHERE user_id = u.id) AS "displayName",
					(SELECT bool_or(public) FROM profile WHERE user_id = u.id) AS "profilePublic"
				FROM "user" u WHERE u.id = ${user.id}
			`
			const expected = {
				name: user.name,
				email: user.email,
				unconfirmedEmail: null,
				themePreference: 'system',
				role: user.role,
				language: user.language,
				emailIsConfirmed: user.emailIsConfirmed,
				newsletterOptIn: false,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				acceptedTosVersionId: null,
				acceptedTosAt: null,
				passwordCount: '1',
				passwordHash: user.passwordHash,
				profileCount: '1',
				profileId: user.profileId,
				displayName: user.displayName,
				profilePublic: false,
			}
			if (canonicalValue(actual) !== canonicalValue(expected)) {
				throw new Error(
					`Existing migrated account ${user.id} does not match source`,
				)
			}
			return 'existing' as const
		})
	}

	/** Canonicalizes an exact coordinate pair for the in-process location-ID cache. */
	private locationKey(longitude: number, latitude: number) {
		return `${Object.is(longitude, -0) ? 0 : longitude},${Object.is(latitude, -0) ? 0 : latitude}`
	}

	/**
	 * Bulk-inserts distinct PostGIS points and resolves their IDs for foreign keys.
	 * The bounded cache avoids repeated lookups without growing with the full history.
	 */
	private async resolveLocationIds(
		client: QueryClient,
		coordinates: Array<{ longitude: number; latitude: number }>,
	) {
		if (this.locationIds.size > 100_000) this.locationIds.clear()
		const missing = new Map<string, { longitude: number; latitude: number }>()
		for (const coordinate of coordinates) {
			const key = this.locationKey(coordinate.longitude, coordinate.latitude)
			if (!this.locationIds.has(key)) missing.set(key, coordinate)
		}
		if (missing.size > 0) {
			const values = [...missing.values()]
			const longitudes = values.map((value) => value.longitude)
			const latitudes = values.map((value) => value.latitude)
			await client`
				WITH input(longitude, latitude) AS (
					SELECT * FROM unnest(
						${client.array(longitudes, 701)},
						${client.array(latitudes, 701)}
					)
				)
				INSERT INTO location (location)
				SELECT DISTINCT ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
				FROM input
				ON CONFLICT (location) DO NOTHING
			`
			const rows = await client<
				Array<{ id: string; longitude: number; latitude: number }>
			>`
				WITH input(longitude, latitude) AS (
					SELECT * FROM unnest(
						${client.array(longitudes, 701)},
						${client.array(latitudes, 701)}
					)
				)
				SELECT l.id::text AS id, ST_X(l.location) AS longitude,
					ST_Y(l.location) AS latitude
				FROM input
				JOIN location l
				  ON l.location = ST_SetSRID(
					ST_MakePoint(input.longitude, input.latitude), 4326
				  )
			`
			for (const row of rows) {
				this.locationIds.set(
					this.locationKey(row.longitude, row.latitude),
					row.id,
				)
			}
			if (
				values.some(
					(value) =>
						!this.locationIds.has(
							this.locationKey(value.longitude, value.latitude),
						),
				)
			) {
				throw new Error('Failed to resolve one or more target locations')
			}
		}
		return this.locationIds
	}

	/**
	 * Inserts one device together with all sensors and policy-retained legacy locations
	 * in a transaction. A replay validates the existing aggregate instead of overwriting it.
	 */
	async insertDevice(
		device: MigratedDevice,
		apiKey: string,
		cutoff: Date,
		preservedApiKey: string | null = apiKey,
	) {
		if (this.dryRun) return 'inserted' as const
		return this.sql.begin(async (tx) => {
			const [present] = await tx<[{ exists: boolean }]>`
				SELECT EXISTS (SELECT 1 FROM device WHERE id = ${device.id}) AS exists
			`
			if (present.exists) {
				await this.assertDeviceMatches(tx, device, cutoff, preservedApiKey)
				return 'existing' as const
			}
			await tx`
				INSERT INTO device (
					id, name, image, website, description, tags, link, use_auth,
					"apiKey", exposure, status, model, public, created_at, updated_at,
					archived_at, orphaned_at, latitude, longitude, user_id
				) VALUES (
					${device.id}, ${device.name}, NULL, NULL, ${device.description},
					${device.tags}, ${device.link}, ${device.useAuth}, ${apiKey},
					${device.exposure}, 'old', ${device.model}, ${device.public},
					${device.createdAt}, ${device.updatedAt}, NULL,
					${device.userId === ORPHAN_USER_ID ? cutoff : null},
					${device.latitude}, ${device.longitude}, ${device.userId}
				)
			`

			for (const sensor of device.sensors) {
				await tx`
					INSERT INTO sensor (
						id, title, unit, sensor_type, icon, status,
						created_at, updated_at, device_id, "lastMeasurement", "order"
					) VALUES (
						${sensor.id}, ${sensor.title}, ${sensor.unit}, ${sensor.sensorType},
						${sensor.icon}, 'old', ${device.createdAt}, ${device.updatedAt},
						${device.id}, NULL, ${sensor.order}
					)
				`
			}

			const locationIds = await this.resolveLocationIds(tx, device.locations)
			const deviceLocationRows = device.locations.map((location) => ({
				device_id: device.id,
				location_id: locationIds.get(
					this.locationKey(location.longitude, location.latitude),
				)!,
				time: location.time,
			}))
			for (
				let offset = 0;
				offset < deviceLocationRows.length;
				offset += 10_000
			) {
				const rows = deviceLocationRows.slice(offset, offset + 10_000)
				await tx`
					INSERT INTO device_to_location ${tx(
						rows,
						'device_id',
						'location_id',
						'time',
					)}
				`
			}
			return 'inserted' as const
		})
	}

	/**
	 * Proves an already-present device, its sensors, locations, and preserved key are
	 * exactly the pre-finalization values expected at a safe resume boundary.
	 */
	private async assertDeviceMatches(
		client: QueryClient,
		device: MigratedDevice,
		cutoff: Date,
		preservedApiKey: string | null,
	) {
		const [actualDevice] = await client<
			Array<Record<string, unknown> & { apiKey: string | null }>
		>`
			SELECT name, image, website, description, tags, link,
				use_auth AS "useAuth", "apiKey", exposure, status, model, public,
				created_at AS "createdAt", updated_at AS "updatedAt",
				archived_at AS "archivedAt", orphaned_at AS "orphanedAt",
				latitude, longitude, user_id AS "userId",
				device_schema_version_id AS "deviceSchemaVersionId"
			FROM device WHERE id = ${device.id}
		`
		const { apiKey: actualApiKey, ...actualWithoutApiKey } = actualDevice
		const expectedDevice = {
			name: device.name,
			image: null,
			website: null,
			description: device.description,
			tags: device.tags,
			link: device.link,
			useAuth: device.useAuth,
			exposure: device.exposure,
			status: 'old',
			model: device.model,
			public: device.public,
			createdAt: device.createdAt,
			updatedAt: device.updatedAt,
			archivedAt: null,
			orphanedAt: device.userId === ORPHAN_USER_ID ? cutoff : null,
			latitude: device.latitude,
			longitude: device.longitude,
			userId: device.userId,
			deviceSchemaVersionId: null,
		}
		if (
			canonicalValue(actualWithoutApiKey) !== canonicalValue(expectedDevice) ||
			(preservedApiKey !== null
				? actualApiKey !== preservedApiKey
				: typeof actualApiKey !== 'string' || actualApiKey.length === 0)
		) {
			throw new Error(
				`Existing migrated device ${device.id} does not match source`,
			)
		}

		const actualSensors = await client<Array<Record<string, unknown>>>`
			SELECT id, title, unit, sensor_type AS "sensorType", icon, status,
				created_at AS "createdAt", updated_at AS "updatedAt",
				device_id AS "deviceId", "lastMeasurement", "order"
			FROM sensor WHERE device_id = ${device.id}
			ORDER BY "order", id
		`
		const expectedSensors = [...device.sensors]
			.sort(
				(left, right) =>
					left.order - right.order || left.id.localeCompare(right.id),
			)
			.map((sensor) => ({
				id: sensor.id,
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				status: 'old',
				createdAt: device.createdAt,
				updatedAt: device.updatedAt,
				deviceId: device.id,
				lastMeasurement: null,
				order: sensor.order,
			}))
		if (canonicalValue(actualSensors) !== canonicalValue(expectedSensors)) {
			throw new Error(
				`Existing sensors for device ${device.id} do not match source`,
			)
		}

		const actualLocationRows = await client<
			Array<{ longitude: number; latitude: number; timeMs: number }>
		>`
			SELECT ST_X(l.location) AS longitude, ST_Y(l.location) AS latitude,
				(extract(epoch FROM dl.time AT TIME ZONE 'UTC') * 1000)::double precision
					AS "timeMs"
			FROM device_to_location dl
			JOIN location l ON l.id = dl.location_id
			WHERE dl.device_id = ${device.id}
			ORDER BY dl.time, longitude, latitude
		`
		const actualLocations = actualLocationRows.map(
			({ longitude, latitude, timeMs }) => ({
				longitude,
				latitude,
				time: new Date(timeMs),
			}),
		)
		const expectedLocations = [...device.locations].sort(
			(left, right) =>
				left.time.getTime() - right.time.getTime() ||
				left.longitude - right.longitude ||
				left.latitude - right.latitude,
		)
		if (canonicalValue(actualLocations) !== canonicalValue(expectedLocations)) {
			throw new Error(
				`Existing locations for device ${device.id} do not match source`,
			)
		}
	}

	/**
	 * Resolves optional measurement locations and inserts a batch idempotently by
	 * sensor/time. Conflicting replayed rows are compared and cause a hard failure.
	 */
	async insertMeasurementBatch(measurements: MigratedMeasurement[]) {
		if (this.dryRun) {
			return { written: measurements.length, skipped: 0 }
		}
		return this.sql.begin(async (tx) => {
			const coordinates = measurements.flatMap((measurement) =>
				measurement.location ? [measurement.location] : [],
			)
			const locationIds = await this.resolveLocationIds(tx, coordinates)
			const rows: Array<{
				sensor_id: string
				time: Date
				value: number
				location_id: string | null
			}> = []
			for (const measurement of measurements) {
				const locationId = measurement.location
					? locationIds.get(
							this.locationKey(
								measurement.location.longitude,
								measurement.location.latitude,
							),
						)!
					: null
				rows.push({
					sensor_id: measurement.sensorId,
					time: measurement.time,
					value: measurement.value,
					location_id: locationId,
				})
			}
			if (rows.length === 0) {
				return { written: 0, skipped: 0 }
			}
			const inserted = await tx<Array<{ sensorId: string; time: Date }>>`
				INSERT INTO measurement ${tx(
					rows,
					'sensor_id',
					'time',
					'value',
					'location_id',
				)}
				ON CONFLICT (sensor_id, time) DO NOTHING
				RETURNING sensor_id AS "sensorId", time
			`
			if (inserted.length !== rows.length) {
				const insertedKeys = new Set(
					inserted.map((row) => `${row.sensorId}\0${row.time.toISOString()}`),
				)
				for (const measurement of measurements) {
					const key = `${measurement.sensorId}\0${measurement.time.toISOString()}`
					if (insertedKeys.has(key)) continue
					const [actual] = await tx<
						Array<{
							value: number
							longitude: number | null
							latitude: number | null
						}>
					>`
						SELECT m.value, ST_X(l.location) AS longitude,
							ST_Y(l.location) AS latitude
						FROM measurement m LEFT JOIN location l ON l.id = m.location_id
						WHERE m.sensor_id = ${measurement.sensorId}
						  AND m.time = ${measurement.time}
					`
					const expected = {
						value: measurement.value,
						longitude: measurement.location?.longitude ?? null,
						latitude: measurement.location?.latitude ?? null,
					}
					if (canonicalValue(actual) !== canonicalValue(expected)) {
						throw new Error(
							`Existing measurement ${measurement.sensorId}/${measurement.time.toISOString()} does not match source`,
						)
					}
				}
			}
			return {
				written: rows.length,
				skipped: 0,
				recovered: rows.length - inserted.length,
			}
		})
	}

	/** Sets a migrated image key only when the target is unset or already identical. */
	async updateDeviceImage(deviceId: string, key: string) {
		if (this.dryRun) return
		const rows = await this.sql<Array<{ id: string }>>`
			UPDATE device SET image = ${key}, updated_at = updated_at
			WHERE id = ${deviceId} AND (image IS NULL OR image = ${key})
			RETURNING id
		`
		if (rows.length !== 1)
			throw new Error('Existing migrated device image does not match source')
	}

	/** Reads the image object key used by final media validation. */
	async deviceImageKey(deviceId: string) {
		const [row] = await this.sql<Array<{ image: string | null }>>`
			SELECT image FROM device WHERE id = ${deviceId}
		`
		return row?.image ?? null
	}

	/** Finds non-archived orphan devices whose authentication needs operator attention. */
	async activeAuthenticatedOrphanDeviceIds(runId: string) {
		const rows = await this.sql<Array<{ id: string }>>`
			SELECT d.id FROM device d
			JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
			WHERE d.orphaned_at IS NOT NULL AND d.archived_at IS NULL
			  AND d.use_auth IS TRUE
			ORDER BY d.id
		`
		return rows.map((row) => row.id)
	}

	/**
	 * Records immutable media provenance; a replay is accepted only for the same
	 * device, object key, content hash, size, and successful upload state.
	 */
	async recordAsset(args: {
		runId: string
		sourcePath: string
		deviceId: string
		bucket: string
		key: string
		sha256: string
		bytes: number
		status: string
		etag?: string
	}) {
		if (this.dryRun) return
		const inserted = await this.sql<Array<{ sourcePath: string }>>`
			INSERT INTO osem_migration.asset (
				run_id, source_path, device_id, target_bucket, target_key,
				sha256, bytes, status, etag
			) VALUES (
				${args.runId}, ${args.sourcePath}, ${args.deviceId}, ${args.bucket},
				${args.key}, ${args.sha256}, ${args.bytes}, ${args.status},
				${args.etag ?? null}
			)
			ON CONFLICT (run_id, source_path) DO NOTHING
			RETURNING source_path AS "sourcePath"
		`
		if (inserted.length === 0) {
			const [existing] = await this.sql<
				Array<Record<string, unknown> & { status: string }>
			>`
				SELECT device_id AS "deviceId", target_bucket AS bucket,
					target_key AS key, sha256, bytes::text, status, etag
				FROM osem_migration.asset
				WHERE run_id = ${args.runId} AND source_path = ${args.sourcePath}
			`
			const { status, etag: _etag, ...actual } = existing
			const expected = {
				deviceId: args.deviceId,
				bucket: args.bucket,
				key: args.key,
				sha256: args.sha256,
				bytes: String(args.bytes),
			}
			if (
				!['uploaded', 'skipped'].includes(status) ||
				canonicalValue(actual) !== canonicalValue(expected)
			) {
				throw new Error(
					`Existing media audit record for ${args.deviceId} does not match source`,
				)
			}
		}
	}

	/** Confirms that a successful media audit row matches the expected object metadata. */
	async assetMatches(args: {
		runId: string
		deviceId: string
		key: string
		sha256: string
		bytes: number
	}) {
		const [row] = await this.sql<[{ matches: boolean }]>`
			SELECT EXISTS (
				SELECT 1 FROM osem_migration.asset
				WHERE run_id = ${args.runId} AND device_id = ${args.deviceId}
				  AND target_key = ${args.key} AND sha256 = ${args.sha256}
				  AND bytes = ${args.bytes}
				  AND status IN ('uploaded', 'skipped')
			) AS matches
		`
		return row.matches
	}

	/** Upserts validation counts and digests for a deterministic entity partition. */
	async saveManifest(args: {
		runId: string
		entity: string
		partitionKey?: string
		expectedCount: number
		sourceSha256?: string
		targetCount?: number
		targetSha256?: string
		details?: Record<string, unknown>
	}) {
		if (this.dryRun) return
		await this.sql`
			INSERT INTO osem_migration.manifest (
				run_id, entity, partition_key, expected_count, source_sha256,
				target_count, target_sha256, details
			) VALUES (
				${args.runId}, ${args.entity}, ${args.partitionKey ?? ''},
				${args.expectedCount}, ${args.sourceSha256 ?? null},
				${args.targetCount ?? null}, ${args.targetSha256 ?? null},
				${this.sql.json(json(args.details ?? {}))}
			)
			ON CONFLICT (run_id, entity, partition_key) DO UPDATE SET
				expected_count = excluded.expected_count,
				source_sha256 = excluded.source_sha256,
				target_count = excluded.target_count,
				target_sha256 = excluded.target_sha256,
				details = excluded.details
		`
	}

	/** Loads ordered manifests so an interrupted validation phase can verify its cursor. */
	async manifestRows(runId: string, entity: string) {
		const rows = await this.sql<
			Array<{
				partitionKey: string
				expectedCount: string
				targetCount: string | null
				details: Record<string, unknown>
			}>
		>`
			SELECT partition_key AS "partitionKey",
				expected_count::text AS "expectedCount",
				target_count::text AS "targetCount", details
			FROM osem_migration.manifest
			WHERE run_id = ${runId} AND entity = ${entity}
			ORDER BY partition_key
		`
		return rows.map((row) => ({
			partitionKey: row.partitionKey,
			expectedCount: Number(row.expectedCount),
			targetCount: row.targetCount === null ? null : Number(row.targetCount),
			details: row.details,
		}))
	}

	/** Streams one sensor's target rows in digest order without loading them all in memory. */
	async *measurementsForSensor(sensorId: string, from: Date, to: Date) {
		const query = this.sql<
			Array<{
				sensorId: string
				time: Date
				value: number
				longitude: number | null
				latitude: number | null
			}>
		>`
			SELECT m.sensor_id AS "sensorId", m.time, m.value,
				ST_X(l.location) AS longitude, ST_Y(l.location) AS latitude
			FROM measurement m
			LEFT JOIN location l ON l.id = m.location_id
			WHERE m.sensor_id = ${sensorId} AND m.time >= ${from} AND m.time < ${to}
			ORDER BY m.time
		`
		for await (const rows of query.cursor(1_000)) {
			for (const row of rows) yield row
		}
	}

	/**
	 * Discovers and journals required Timescale/pg_cron jobs, pauses only those that
	 * were active, then proves they are inactive and idle before bulk writes begin.
	 */
	async pauseBackgroundJobs(runId: string): Promise<PausedJob[]> {
		if (this.dryRun) return []
		const [role] = await this.sql<[{ isSuperuser: boolean }]>`
			SELECT rolsuper AS "isSuperuser"
			FROM pg_roles WHERE rolname = current_user
		`
		if (!role?.isSuperuser) {
			throw new Error(
				'Automatic background-job management requires a PostgreSQL superuser so pg_cron jobs cannot be hidden by row-level security; otherwise use --no-manage-jobs and pause them externally',
			)
		}
		const [cronLogging] = await this.sql<[{ enabled: boolean }]>`
			SELECT COALESCE(current_setting('cron.log_run', true), 'off') = 'on' AS enabled
		`
		if (!cronLogging?.enabled) {
			throw new Error(
				'Automatic background-job management requires cron.log_run=on to verify that pg_cron jobs are idle',
			)
		}
		let { jobs, state } = await this.jobRecord(runId)
		if (state === 'none') {
			const [timescaleJobRows, aggregateRows] = await Promise.all([
				this.sql<TimescaleJobCatalogRow[]>`
					SELECT job_id AS "jobId", proc_name AS "procName",
						hypertable_schema AS "hypertableSchema",
						hypertable_name AS "hypertableName", scheduled
					FROM timescaledb_information.jobs
				`,
				this.sql<ContinuousAggregateCatalogRow[]>`
					SELECT view_schema AS "viewSchema", view_name AS "viewName",
						materialization_hypertable_schema AS "materializationSchema",
						materialization_hypertable_name AS "materializationName"
					FROM timescaledb_information.continuous_aggregates
					WHERE view_schema = 'public'
					  AND view_name IN (
						'measurement_10min', 'measurement_1hour',
						'measurement_1day', 'measurement_1month',
						'measurement_1year'
					  )
				`,
			])
			const timescaleJobs = discoverTimescaleJobs(
				timescaleJobRows,
				aggregateRows,
			)
			const cronJobs = await this.sql<
				Array<{ jobId: number; name: string; active: boolean }>
			>`
				SELECT jobid AS "jobId", jobname AS name, active
				FROM cron.job
				WHERE jobname IN (
					'device-archive-inactive', 'cleanup_expired_tos_users',
					'delete-temporary-devices'
				)
			`
			const discoveredNames = new Set([
				...timescaleJobs.map((job) => job.name),
				...cronJobs.map((job) => job.name),
			])
			const missingJobs = REQUIRED_BACKGROUND_JOB_NAMES.filter(
				(name) => !discoveredNames.has(name),
			)
			if (missingJobs.length > 0) {
				throw new Error(
					`Required background jobs are missing or invisible: ${missingJobs.join(', ')}`,
				)
			}
			jobs = [
				...timescaleJobs.map((job) => ({
					kind: 'timescale' as const,
					id: job.jobId,
					name: job.name,
					wasActive: job.scheduled,
				})),
				...cronJobs.map((job) => ({
					kind: 'pg_cron' as const,
					id: job.jobId,
					name: job.name,
					wasActive: job.active,
				})),
			]
			await this.sql`
				UPDATE osem_migration.run
				SET paused_jobs = ${this.sql.json(json(jobs))},
					jobs_state = 'recorded', updated_at = now()
				WHERE id = ${runId}
			`
		}
		const recordedNames = new Set(jobs.map((job) => job.name))
		const missingRecordedJobs = REQUIRED_BACKGROUND_JOB_NAMES.filter(
			(name) => !recordedNames.has(name),
		)
		if (missingRecordedJobs.length > 0) {
			throw new Error(
				`Recorded background-job state is incomplete: ${missingRecordedJobs.join(', ')}`,
			)
		}

		for (const job of jobs) {
			if (!job.wasActive) continue
			if (job.kind === 'timescale') {
				await this.sql`SELECT alter_job(${job.id}, scheduled => false)`
			} else {
				await this.setCronJobActive(job.id, false)
			}
		}
		await this.assertBackgroundJobsInactive(jobs)
		await this.waitForBackgroundJobsIdle(jobs)
		await this.assertBackgroundJobsInactive(jobs)
		await this.sql`
			UPDATE osem_migration.run
			SET jobs_state = 'paused', updated_at = now()
			WHERE id = ${runId}
		`
		return jobs
	}

	/** Verifies every recorded Timescale and pg_cron job is currently disabled. */
	private async assertBackgroundJobsInactive(jobs: PausedJob[]) {
		const timescaleJobs = jobs.filter((job) => job.kind === 'timescale')
		if (timescaleJobs.length > 0) {
			const rows = await this.sql<Array<{ id: number; scheduled: boolean }>>`
				SELECT job_id AS id, scheduled
				FROM timescaledb_information.jobs
				WHERE job_id IN ${this.sql(timescaleJobs.map((job) => job.id))}
			`
			if (
				rows.length !== timescaleJobs.length ||
				rows.some((row) => row.scheduled)
			) {
				throw new Error(
					'One or more required TimescaleDB jobs could not be verified as paused',
				)
			}
		}

		const cronJobs = jobs.filter((job) => job.kind === 'pg_cron')
		if (cronJobs.length > 0) {
			const rows = await this.sql<Array<{ id: number; active: boolean }>>`
				SELECT jobid AS id, active FROM cron.job
				WHERE jobid IN ${this.sql(cronJobs.map((job) => job.id))}
			`
			if (rows.length !== cronJobs.length || rows.some((row) => row.active)) {
				throw new Error(
					'One or more required pg_cron jobs could not be verified as paused',
				)
			}
		}
	}

	/**
	 * Waits for already-running jobs to finish and requires two idle observations to
	 * reduce the race between disabling a schedule and starting migration writes.
	 */
	private async waitForBackgroundJobsIdle(jobs: PausedJob[]) {
		const timescaleIds = jobs
			.filter((job) => job.kind === 'timescale')
			.map((job) => job.id)
		const cronIds = jobs
			.filter((job) => job.kind === 'pg_cron')
			.map((job) => job.id)
		const deadline = Date.now() + BACKGROUND_JOB_IDLE_TIMEOUT_MS
		let consecutiveIdleChecks = 0
		while (Date.now() < deadline) {
			const [timescaleRunning, cronRunning] = await Promise.all([
				timescaleIds.length > 0
					? this.sql<Array<{ id: number }>>`
						SELECT job_id AS id
						FROM timescaledb_information.job_stats
						WHERE job_id IN ${this.sql(timescaleIds)}
						  AND lower(job_status) = 'running'
					`
					: Promise.resolve([]),
				cronIds.length > 0
					? this.sql<Array<{ id: number }>>`
						SELECT DISTINCT jobid AS id FROM cron.job_run_details
						WHERE jobid IN ${this.sql(cronIds)} AND end_time IS NULL
					`
					: Promise.resolve([]),
			])
			if (timescaleRunning.length === 0 && cronRunning.length === 0) {
				consecutiveIdleChecks++
				if (consecutiveIdleChecks >= 2) return
			} else {
				consecutiveIdleChecks = 0
			}
			await this.sql`SELECT pg_sleep(1)`
		}
		throw new Error(
			'Background jobs did not become idle within five minutes; migration writes were not started',
		)
	}

	/** Loads the original job activity snapshot and its pause/restore state. */
	private async jobRecord(runId: string) {
		if (this.dryRun) return { jobs: [], state: 'none' as const }
		const [row] = await this.sql<
			Array<{
				jobs: PausedJob[]
				state: 'none' | 'recorded' | 'paused' | 'restored'
			}>
		>`
			SELECT paused_jobs AS jobs, jobs_state AS state
			FROM osem_migration.run WHERE id = ${runId}
		`
		return row ?? { jobs: [], state: 'none' as const }
	}

	/** Exposes journaled job state to command-level recovery and cleanup logic. */
	async backgroundJobState(runId: string) {
		return this.jobRecord(runId)
	}

	/** Toggles pg_cron through its API when available, with a version-compatible fallback. */
	private async setCronJobActive(jobId: number, active: boolean) {
		const [capability] = await this.sql<[{ supported: boolean }]>`
			SELECT EXISTS (
				SELECT 1 FROM pg_proc p
				JOIN pg_namespace n ON n.oid = p.pronamespace
				WHERE n.nspname = 'cron' AND p.proname = 'alter_job'
			) AS supported
		`
		if (capability.supported) {
			await this.sql`
				SELECT cron.alter_job(job_id := ${jobId}, active := ${active})
			`
			return
		}
		await this.sql`
			UPDATE cron.job SET active = ${active} WHERE jobid = ${jobId}
		`
	}

	/** Restores exactly the jobs that were active before migration and marks that fact. */
	async restoreBackgroundJobs(runId: string) {
		if (this.dryRun) return
		const { jobs, state } = await this.jobRecord(runId)
		if (state === 'none' || state === 'restored') return
		for (const job of jobs) {
			if (!job.wasActive) continue
			if (job.kind === 'timescale') {
				await this.sql`SELECT alter_job(${job.id}, scheduled => true)`
			} else {
				await this.setCronJobActive(job.id, true)
			}
		}
		await this.sql`
			UPDATE osem_migration.run
			SET jobs_state = 'restored', updated_at = now()
			WHERE id = ${runId}
		`
	}

	/**
	 * Rebuilds last-measurement caches and lifecycle/archive/orphan fields solely for
	 * run-owned entities, then refreshes planner statistics after the bulk load.
	 */
	async finalize(runId: string, from: Date, cutoff: Date, archiveBefore: Date) {
		if (this.dryRun) return
		await this.sql`
			UPDATE sensor s
			SET "lastMeasurement" = NULL, status = 'old'
			FROM osem_migration.entity e
			WHERE e.run_id = ${runId} AND e.entity = 'sensor'
			  AND e.source_id = s.id
		`
		await this.sql`
			WITH latest AS (
				SELECT DISTINCT ON (m.sensor_id) m.sensor_id, m.time, m.value
				FROM measurement m
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'sensor'
				 AND e.source_id = m.sensor_id
				WHERE m.time >= ${from} AND m.time < ${cutoff}
				ORDER BY m.sensor_id, m.time DESC
			)
			UPDATE sensor s
			SET "lastMeasurement" = json_build_object(
					'value', latest.value,
					'createdAt', to_char(
						latest.time AT TIME ZONE 'UTC',
						'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
					),
					'sensorId', latest.sensor_id
				),
				status = CASE
					WHEN latest.time > ${cutoff}::timestamptz - interval '7 days' THEN 'active'::status
					WHEN latest.time > ${cutoff}::timestamptz - interval '30 days' THEN 'inactive'::status
					ELSE 'old'::status
				END
			FROM latest
			WHERE s.id = latest.sensor_id
		`
		await this.sql`
			WITH migrated_devices AS (
				SELECT source_id AS id FROM osem_migration.entity
				WHERE run_id = ${runId} AND entity = 'device'
			), latest AS (
				SELECT d.id,
					max(NULLIF(s."lastMeasurement"->>'createdAt', '')::timestamptz) AS last_at
				FROM migrated_devices md
				JOIN device d ON d.id = md.id
				LEFT JOIN sensor s ON s.device_id = d.id
				GROUP BY d.id
			)
			UPDATE device d
			SET status = CASE
					WHEN latest.last_at > ${cutoff}::timestamptz - interval '7 days' THEN 'active'::status
					WHEN latest.last_at > ${cutoff}::timestamptz - interval '30 days' THEN 'inactive'::status
					ELSE 'old'::status
				END,
				archived_at = CASE
					WHEN latest.last_at IS NULL OR latest.last_at < ${archiveBefore}
						THEN ${cutoff}
					ELSE NULL
				END,
				orphaned_at = CASE
					WHEN d.user_id = ${ORPHAN_USER_ID} THEN ${cutoff}
					ELSE NULL
				END
			FROM latest
			WHERE latest.id = d.id
		`
		await this.sql`ANALYZE measurement`
		await this.sql`ANALYZE sensor`
		await this.sql`ANALYZE device`
	}

	/** Returns the trusted bucket interval for a supported migration aggregate view. */
	private aggregateBucket(view: string) {
		const buckets: Record<string, string> = {
			measurement_10min: '10 minutes',
			measurement_1hour: '1 hour',
			measurement_1day: '1 day',
			measurement_1month: '1 month',
			measurement_1year: '1 year',
		}
		const bucket = buckets[view]
		if (!bucket) {
			throw new Error(`Unsupported continuous aggregate: ${view}`)
		}
		return bucket
	}

	/**
	 * Clips refresh/validation to complete buckets so partial edge buckets are never
	 * mistaken for fully migrated aggregates.
	 */
	private async completeAggregateBounds(bucket: string, from: Date, to: Date) {
		const [bounds] = await this.sql.unsafe<Array<{ start: Date; end: Date }>>(
			`SELECT
				CASE
					WHEN time_bucket(INTERVAL '${bucket}', $1::timestamptz) = $1::timestamptz
						THEN $1::timestamptz
					ELSE time_bucket(INTERVAL '${bucket}', $1::timestamptz) + INTERVAL '${bucket}'
				END AS start,
				time_bucket(INTERVAL '${bucket}', $2::timestamptz) AS end`,
			[from.toISOString(), to.toISOString()],
		)
		return bounds
	}

	/** Materializes complete buckets for one allow-listed Timescale aggregate. */
	async refreshContinuousAggregate(view: string, from: Date, to: Date) {
		if (this.dryRun) return
		const bucket = this.aggregateBucket(view)
		const bounds = await this.completeAggregateBounds(bucket, from, to)
		if (bounds.start >= bounds.end) return
		await this.sql.unsafe(
			`CALL refresh_continuous_aggregate('${view}', $1::timestamptz, $2::timestamptz)`,
			[bounds.start.toISOString(), bounds.end.toISOString()],
		)
	}

	/**
	 * Recomputes every aggregate level from its source relation and compares counts and
	 * statistical values with the materialized migration output.
	 */
	async continuousAggregateValidation(runId: string, from: Date, to: Date) {
		const views = await this.sql<
			Array<{ viewName: string; materializedOnly: boolean }>
		>`
			SELECT view_name AS "viewName", materialized_only AS "materializedOnly"
			FROM timescaledb_information.continuous_aggregates
			WHERE view_schema = 'public'
			  AND view_name IN (
				'measurement_10min', 'measurement_1hour', 'measurement_1day',
				'measurement_1month', 'measurement_1year'
			  )
		`
		const levels = [
			{
				view: 'measurement_10min',
				source: 'measurement',
				bucket: '10 minutes',
				valueExpression: 'avg(source.value)',
			},
			{
				view: 'measurement_1hour',
				source: 'measurement_10min',
				bucket: '1 hour',
				valueExpression: 'mean(rollup(source.percentile_10min))',
			},
			{
				view: 'measurement_1day',
				source: 'measurement_1hour',
				bucket: '1 day',
				valueExpression: 'mean(rollup(source.percentile_1hour))',
			},
			{
				view: 'measurement_1month',
				source: 'measurement_1day',
				bucket: '1 month',
				valueExpression: 'mean(rollup(source.percentile_1day))',
			},
			{
				view: 'measurement_1year',
				source: 'measurement_1day',
				bucket: '1 year',
				valueExpression: 'mean(rollup(source.percentile_1day))',
			},
		] as const
		const statistics: Record<
			string,
			{
				expectedCount: number
				count: number
				mismatchCount: number
				min: Date | null
				max: Date | null
			}
		> = {}
		for (const level of levels) {
			const bounds = await this.completeAggregateBounds(level.bucket, from, to)
			if (bounds.start >= bounds.end) {
				statistics[level.view] = {
					expectedCount: 0,
					count: 0,
					mismatchCount: 0,
					min: null,
					max: null,
				}
				continue
			}
			const [row] = await this.sql.unsafe<
				Array<{
					expectedCount: string
					count: string
					mismatchCount: string
					min: Date | null
					max: Date | null
				}>
			>(
				`WITH expected AS (
					SELECT source.sensor_id,
						time_bucket(INTERVAL '${level.bucket}', source.time) AS time,
						count(*) AS total_values,
						${level.valueExpression} AS avg_value,
						min(source.${level.source === 'measurement' ? 'value' : 'min_value'}) AS min_value,
						max(source.${level.source === 'measurement' ? 'value' : 'max_value'}) AS max_value
					FROM ${level.source} source
					JOIN osem_migration.entity e
					  ON e.run_id = $1 AND e.entity = 'sensor'
					 AND e.source_id = source.sensor_id
					WHERE source.time >= $2::timestamptz
					  AND source.time < $3::timestamptz
					GROUP BY source.sensor_id,
						time_bucket(INTERVAL '${level.bucket}', source.time)
				), actual AS (
					SELECT target.sensor_id, target.time, target.total_values,
						target.avg_value, target.min_value, target.max_value
					FROM ${level.view} target
					JOIN osem_migration.entity e
					  ON e.run_id = $1 AND e.entity = 'sensor'
					 AND e.source_id = target.sensor_id
					WHERE target.time >= $2::timestamptz
					  AND target.time < $3::timestamptz
				), compared AS (
					SELECT expected.sensor_id AS expected_sensor,
						actual.sensor_id AS actual_sensor,
						expected.total_values AS expected_total,
						actual.total_values AS actual_total,
						expected.avg_value AS expected_avg,
						actual.avg_value AS actual_avg,
						expected.min_value AS expected_min,
						actual.min_value AS actual_min,
						expected.max_value AS expected_max,
						actual.max_value AS actual_max
					FROM expected FULL JOIN actual
					  ON actual.sensor_id = expected.sensor_id
					 AND actual.time = expected.time
				), summary AS (
					SELECT
						(SELECT count(*) FROM expected) AS expected_count,
						(SELECT count(*) FROM actual) AS actual_count,
						(SELECT min(time) FROM actual) AS min_time,
						(SELECT max(time) FROM actual) AS max_time,
						count(*) FILTER (WHERE
							expected_sensor IS NULL OR actual_sensor IS NULL
							OR expected_total IS DISTINCT FROM actual_total
							OR (expected_avg IS NULL) IS DISTINCT FROM (actual_avg IS NULL)
							OR (expected_avg IS NOT NULL AND actual_avg IS NOT NULL
								AND abs(expected_avg - actual_avg) > 1e-12)
							OR expected_min IS DISTINCT FROM actual_min
							OR expected_max IS DISTINCT FROM actual_max
						) AS mismatch_count
					FROM compared
				)
				SELECT expected_count::text AS "expectedCount",
					actual_count::text AS count,
					mismatch_count::text AS "mismatchCount",
					min_time AS min, max_time AS max
				FROM summary`,
				[runId, bounds.start.toISOString(), bounds.end.toISOString()],
			)
			statistics[level.view] = {
				expectedCount: Number(row.expectedCount),
				count: Number(row.count),
				mismatchCount: Number(row.mismatchCount),
				min: row.min,
				max: row.max,
			}
		}
		return {
			views: views.map((row) => row.viewName),
			contracts: views,
			tenMinuteMismatch: statistics.measurement_10min?.mismatchCount ?? 0,
			mismatchCount: Object.values(statistics).reduce(
				(total, value) => total + value.mismatchCount,
				0,
			),
			statistics,
		}
	}

	/** Returns run-owned devices finalized as archived for integration disabling. */
	async archivedDeviceIds(runId: string) {
		const rows = await this.sql<Array<{ id: string }>>`
			SELECT d.id FROM device d
			JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
			WHERE d.archived_at IS NOT NULL
		`
		return rows.map((row) => row.id)
	}

	/** Returns the set of device rows proven to belong to this migration run. */
	async deviceIds(runId: string) {
		const rows = await this.sql<Array<{ id: string }>>`
			SELECT d.id FROM device d
			JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
		`
		return new Set(rows.map((row) => row.id))
	}

	/** Loads run-owned device-to-user mappings for ownership validation. */
	async deviceOwners(runId: string) {
		const rows = await this.sql<Array<{ id: string; userId: string }>>`
			SELECT d.id, d.user_id AS "userId" FROM device d
			JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
		`
		return new Map(rows.map((row) => [row.id, row.userId]))
	}

	/** Loads run-owned device credentials for preservation and uniqueness checks. */
	async deviceApiKeys(runId: string) {
		const rows = await this.sql<Array<{ id: string; apiKey: string | null }>>`
			SELECT d.id, d."apiKey" AS "apiKey" FROM device d
			JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
		`
		return new Map(rows.map((row) => [row.id, row.apiKey]))
	}

	/** Loads run-owned sensor-to-device mappings for relationship validation. */
	async sensorDevices(runId: string) {
		const rows = await this.sql<Array<{ id: string; deviceId: string }>>`
			SELECT s.id, s.device_id AS "deviceId" FROM sensor s
			JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = s.id
		`
		return new Map(rows.map((row) => [row.id, row.deviceId]))
	}

	/**
	 * Reads source-derived columns and retained device location histories in canonical
	 * shapes, excluding fields intentionally computed later by finalization.
	 */
	async sourceDerivedEntityRows(runId: string) {
		const [users, devices, sensors, locations] = await Promise.all([
			this.sql<
				Array<{
					id: string
					name: string
					email: string
					unconfirmedEmail: string | null
					themePreference: string
					role: string | null
					language: string | null
					emailIsConfirmed: boolean | null
					newsletterOptIn: boolean
					createdAt: Date
					updatedAt: Date
					passwordHash: string | null
					profileId: string | null
					displayName: string | null
					profilePublic: boolean | null
				}>
			>`
				SELECT u.id, u.name, u.email,
					u.unconfirmed_email AS "unconfirmedEmail",
					u.theme_preference AS "themePreference", u.role, u.language,
					u.email_is_confirmed AS "emailIsConfirmed",
					u.newsletter_opt_in AS "newsletterOptIn",
					u.created_at AT TIME ZONE 'UTC' AS "createdAt",
					u.updated_at AT TIME ZONE 'UTC' AS "updatedAt",
					pw.hash AS "passwordHash", p.id AS "profileId",
					p.display_name AS "displayName", p.public AS "profilePublic"
				FROM "user" u
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'user' AND e.source_id = u.id
				LEFT JOIN password pw ON pw.user_id = u.id
				LEFT JOIN profile p ON p.user_id = u.id
			`,
			this.sql<
				Array<{
					id: string
					name: string
					website: string | null
					description: string | null
					tags: string[] | null
					link: string | null
					useAuth: boolean | null
					exposure: string | null
					model: string | null
					public: boolean | null
					createdAt: Date
					updatedAt: Date
					latitude: number
					longitude: number
					userId: string
					deviceSchemaVersionId: string | null
				}>
			>`
				SELECT d.id, d.name, d.website, d.description, d.tags, d.link,
					d.use_auth AS "useAuth", d.exposure, d.model, d.public,
					d.created_at AT TIME ZONE 'UTC' AS "createdAt",
					d.updated_at AT TIME ZONE 'UTC' AS "updatedAt",
					d.latitude, d.longitude, d.user_id AS "userId",
					d.device_schema_version_id AS "deviceSchemaVersionId"
				FROM device d
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
			`,
			this.sql<
				Array<{
					id: string
					title: string
					unit: string | null
					sensorType: string | null
					icon: string | null
					createdAt: Date
					updatedAt: Date
					deviceId: string
					order: number | null
				}>
			>`
				SELECT s.id, s.title, s.unit, s.sensor_type AS "sensorType", s.icon,
					s.created_at AT TIME ZONE 'UTC' AS "createdAt",
					s.updated_at AT TIME ZONE 'UTC' AS "updatedAt",
					s.device_id AS "deviceId", s."order"
				FROM sensor s
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = s.id
			`,
			this.sql<
				Array<{
					deviceId: string
					longitude: number
					latitude: number
					timeMs: number
				}>
			>`
				SELECT dl.device_id AS "deviceId", ST_X(l.location) AS longitude,
					ST_Y(l.location) AS latitude,
					(extract(epoch FROM dl.time AT TIME ZONE 'UTC') * 1000)::double precision
						AS "timeMs"
				FROM device_to_location dl
				JOIN location l ON l.id = dl.location_id
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'device'
				 AND e.source_id = dl.device_id
				ORDER BY dl.device_id, dl.time, longitude, latitude
			`,
		])
		const byDevice = new Map<
			string,
			Array<{ longitude: number; latitude: number; time: Date }>
		>()
		for (const location of locations) {
			const current = byDevice.get(location.deviceId) ?? []
			current.push({
				longitude: location.longitude,
				latitude: location.latitude,
				time: new Date(location.timeMs),
			})
			byDevice.set(location.deviceId, current)
		}
		return {
			users: users.map(({ id, ...value }) => ({ id, value })),
			devices: devices.map(({ id, ...value }) => ({ id, value })),
			sensors: sensors.map(({ id, ...value }) => ({ id, value })),
			locations: byDevice,
		}
	}

	/**
	 * Evaluates run-scoped relational, credential, location, lifecycle, cache, ToS,
	 * and count invariants and returns evidence for the final migration report.
	 */
	async validation(
		runId: string,
		from: Date,
		cutoff: Date,
		archiveBefore: Date,
	) {
		const [invariants] = await this.sql<
			Array<{
				measurementWithoutSensor: string
				measurementOutsideWindow: string
				orphanMismatch: string
				missingApiKey: string
				duplicateApiKey: string
				cacheMismatch: string
				sensorStatusMismatch: string
				deviceStatusMismatch: string
				archiveMismatch: string
				invalidLocation: string
				missingUserRelations: string
				acceptedTosPresent: string
				acceptedTosStatePresent: string
				entityCountMismatch: string
			}>
		>`
			WITH
			measurement_without_sensor AS (
				SELECT count(*) AS value FROM measurement m
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = m.sensor_id
				LEFT JOIN sensor s ON s.id = m.sensor_id
				WHERE m.time >= ${from} AND m.time < ${cutoff} AND s.id IS NULL
			), measurement_outside_window AS (
				SELECT count(*) AS value FROM measurement m
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = m.sensor_id
				WHERE m.time < ${from} OR m.time >= ${cutoff}
			), orphan_mismatch AS (
				SELECT count(*) AS value FROM device d
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
				WHERE (user_id = ${ORPHAN_USER_ID}) IS DISTINCT FROM (orphaned_at IS NOT NULL)
			), missing_key AS (
				SELECT count(*) AS value FROM device d
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
				WHERE d."apiKey" IS NULL
			), duplicate_key AS (
				SELECT count(*) AS value FROM (
					SELECT d."apiKey" FROM device d
					JOIN osem_migration.entity e
					  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
					WHERE d."apiKey" IS NOT NULL
					GROUP BY d."apiKey" HAVING count(*) > 1
				) duplicate
			), latest AS (
				SELECT DISTINCT ON (m.sensor_id) m.sensor_id, m.time, m.value
				FROM measurement m
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = m.sensor_id
				WHERE m.time >= ${from} AND m.time < ${cutoff}
				ORDER BY m.sensor_id, m.time DESC
			), cache_mismatch AS (
				SELECT count(*) AS value FROM sensor s
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = s.id
				LEFT JOIN latest ON latest.sensor_id = s.id
				WHERE (latest.sensor_id IS NULL AND s."lastMeasurement" IS NOT NULL)
				   OR (latest.sensor_id IS NOT NULL AND (
					(s."lastMeasurement"->>'createdAt')::timestamptz IS DISTINCT FROM latest.time
					OR (s."lastMeasurement"->>'value')::double precision IS DISTINCT FROM latest.value
				   ))
			), sensor_status_mismatch AS (
				SELECT count(*) AS value FROM sensor s
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = s.id
				LEFT JOIN latest ON latest.sensor_id = s.id
				WHERE s.status::text IS DISTINCT FROM CASE
					WHEN latest.time > ${cutoff}::timestamptz - interval '7 days' THEN 'active'
					WHEN latest.time > ${cutoff}::timestamptz - interval '30 days' THEN 'inactive'
					ELSE 'old'
				END
			), device_latest AS (
				SELECT d.id, max(NULLIF(s."lastMeasurement"->>'createdAt', '')::timestamptz) AS last_at
				FROM device d
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
				LEFT JOIN sensor s ON s.device_id = d.id GROUP BY d.id
			), archive_mismatch AS (
				SELECT count(*) AS value FROM device d JOIN device_latest l ON l.id = d.id
				WHERE (d.archived_at IS NOT NULL) IS DISTINCT FROM
					(l.last_at IS NULL OR l.last_at < ${archiveBefore})
			), device_status_mismatch AS (
				SELECT count(*) AS value FROM device d
				JOIN device_latest l ON l.id = d.id
				WHERE d.status::text IS DISTINCT FROM CASE
					WHEN l.last_at > ${cutoff}::timestamptz - interval '7 days' THEN 'active'
					WHEN l.last_at > ${cutoff}::timestamptz - interval '30 days' THEN 'inactive'
					ELSE 'old'
				END
			), invalid_location AS (
				SELECT count(DISTINCT l.id) AS value FROM location l
				JOIN device_to_location dl ON dl.location_id = l.id
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = dl.device_id
				WHERE NOT (
					ST_X(l.location) BETWEEN -180 AND 180
					AND ST_Y(l.location) BETWEEN -90 AND 90
				)
			), missing_user_relations AS (
				SELECT count(*) AS value FROM osem_migration.entity e
				LEFT JOIN "user" u ON u.id = e.source_id
				LEFT JOIN profile p ON p.user_id = e.source_id
				LEFT JOIN password pw ON pw.user_id = e.source_id
				WHERE e.run_id = ${runId} AND e.entity = 'user'
				  AND (u.id IS NULL OR p.user_id IS NULL OR pw.user_id IS NULL)
			), accepted_tos_present AS (
				SELECT count(*) AS value FROM "user" u
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'user' AND e.source_id = u.id
				WHERE u.accepted_tos_version_id IS NOT NULL OR u.accepted_tos_at IS NOT NULL
			), accepted_tos_state_present AS (
				SELECT count(*) AS value FROM tos_user_state state
				JOIN osem_migration.entity e
				  ON e.run_id = ${runId} AND e.entity = 'user'
				 AND e.source_id = state.user_id
			), entity_count_mismatch AS (
				SELECT count(*) AS value FROM (
					SELECT e.entity, e.source_id
					FROM osem_migration.entity e
					WHERE e.run_id = ${runId} AND e.entity IN ('user', 'device', 'sensor')
					  AND NOT EXISTS (
						SELECT 1 FROM "user" u WHERE e.entity = 'user' AND u.id = e.source_id
						UNION ALL
						SELECT 1 FROM device d WHERE e.entity = 'device' AND d.id = e.source_id
						UNION ALL
						SELECT 1 FROM sensor s WHERE e.entity = 'sensor' AND s.id = e.source_id
					  )
				) missing
			)
			SELECT
				(SELECT value FROM measurement_without_sensor) AS "measurementWithoutSensor",
				(SELECT value FROM measurement_outside_window) AS "measurementOutsideWindow",
				(SELECT value FROM orphan_mismatch) AS "orphanMismatch",
				(SELECT value FROM missing_key) AS "missingApiKey",
				(SELECT value FROM duplicate_key) AS "duplicateApiKey",
				(SELECT value FROM cache_mismatch) AS "cacheMismatch",
				(SELECT value FROM sensor_status_mismatch) AS "sensorStatusMismatch",
				(SELECT value FROM device_status_mismatch) AS "deviceStatusMismatch",
				(SELECT value FROM archive_mismatch) AS "archiveMismatch",
				(SELECT value FROM invalid_location) AS "invalidLocation",
				(SELECT value FROM missing_user_relations) AS "missingUserRelations",
				(SELECT value FROM accepted_tos_present) AS "acceptedTosPresent",
				(SELECT value FROM accepted_tos_state_present) AS "acceptedTosStatePresent",
				(SELECT value FROM entity_count_mismatch) AS "entityCountMismatch"
		`
		const counts = await this.sql<Array<{ entity: string; count: string }>>`
			SELECT 'users' AS entity, count(*)::text AS count
			FROM "user" u JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'user' AND e.source_id = u.id
			UNION ALL SELECT 'devices', count(*)::text
			FROM device d JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
			UNION ALL SELECT 'sensors', count(*)::text
			FROM sensor s JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = s.id
			UNION ALL SELECT 'measurements', count(*)::text
			FROM measurement m JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'sensor' AND e.source_id = m.sensor_id
			WHERE m.time >= ${from} AND m.time < ${cutoff}
			UNION ALL SELECT 'archived_devices', count(*)::text
			FROM device d JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
			WHERE d.archived_at IS NOT NULL
			UNION ALL SELECT 'orphaned_devices', count(*)::text
			FROM device d JOIN osem_migration.entity e
			  ON e.run_id = ${runId} AND e.entity = 'device' AND e.source_id = d.id
			WHERE d.orphaned_at IS NOT NULL
		`
		const [tos] = await this.sql<Array<{ acceptBy: Date }>>`
			SELECT accept_by AS "acceptBy"
			FROM tos_version
			WHERE effective_from <= ${cutoff}
			ORDER BY effective_from DESC LIMIT 1
		`
		return {
			invariants: Object.fromEntries(
				Object.entries(invariants).map(([key, value]) => [key, Number(value)]),
			),
			counts: Object.fromEntries(
				counts.map((row) => [row.entity, Number(row.count)]),
			),
			tosAcceptBy: tos?.acceptBy ?? null,
		}
	}
}

export type AppSql = AppTarget['sql']
