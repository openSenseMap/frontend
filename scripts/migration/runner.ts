import { redactedConfigHash } from './config'
import { type MigrationDependencies } from './context'
import {
	authenticatedCredentialInventory,
	preservedApiKeyMismatches,
	selectDeviceApiKey,
	validateApiKeyPolicy,
} from './device-credentials'
import {
	accountsPhase,
	devicesPhase,
	finalizePhase,
	integrationsPhase,
	measurementsPhase,
	mediaPhase,
	newPhaseResult,
	throwIfAborted,
} from './phases'
import {
	fatalSourceAnomalies,
	preflight,
	recordExpectedEntities,
	snapshotSha256,
	validateMongoSourceCompatibility,
} from './preflight'
import {
	assertExactPrefix,
	assertProgressBoundary,
	bootstrapLegacyResumeProgress,
	existingValueMismatches,
} from './resume'
import { type MigrationConfig, type PhaseResult, PHASES } from './types'
import { expectedSourceDerivedEntities, validatePhase } from './validation'

export type { MigrationDependencies } from './context'

/**
 * Coordinates one guarded migration run in canonical phase order. It fingerprints
 * the source, establishes resume metadata, controls background jobs, and records
 * each completed phase without weakening production-read protections.
 */
export async function runMigration(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
) {
	throwIfAborted(dependencies)
	if (config.sourceKind === 'restored-backup' && !config.backupId) {
		throw new Error('A restored-backup migration requires a backup ID')
	}
	if (
		config.sourceKind === 'production-readonly' &&
		(!config.dryRun ||
			config.phases.length !== 1 ||
			config.phases[0] !== 'preflight')
	) {
		throw new Error(
			'Production MongoDB is restricted to an explicit read-only preflight',
		)
	}
	if (!config.dryRun && !config.writeFreezeConfirmed) {
		throw new Error(
			'Production write freeze must be confirmed with --confirm-write-freeze',
		)
	}
	if (
		!config.dryRun &&
		(config.phases.length !== PHASES.length ||
			PHASES.some((phase, index) => config.phases[index] !== phase))
	) {
		throw new Error(
			'One-shot data migrations must run every phase in canonical order',
		)
	}
	if (
		!dependencies.mqtt ||
		!dependencies.ttn ||
		(!config.skipImages && !dependencies.images)
	) {
		throw new Error(
			'App and integration targets are required; configure media or set MIGRATION_SKIP_IMAGES=true',
		)
	}
	const snapshot = await dependencies.source.loadSnapshot()
	const sourceFingerprint: Record<string, unknown> = {
		...(await dependencies.source.fingerprint()),
		sourceKind: config.sourceKind,
		backupId: config.backupId ?? null,
		snapshotSha256: snapshotSha256(snapshot),
	}
	await dependencies.app.ensureControlSchema()
	await dependencies.app.beginRun(
		config,
		redactedConfigHash(config),
		sourceFingerprint,
	)
	await recordExpectedEntities(config, dependencies, snapshot)
	await preflight(config, dependencies, snapshot, sourceFingerprint)
	await bootstrapLegacyResumeProgress(config, dependencies, snapshot)
	const validationAlreadyCompleted =
		config.resume &&
		!config.dryRun &&
		(await dependencies.app.phaseProgress(config.runId, 'validate'))?.status ===
			'completed'

	if (!config.dryRun && config.manageJobs && !validationAlreadyCompleted) {
		const jobs = await dependencies.app.pauseBackgroundJobs(config.runId)
		if (!jobs.some((job) => job.name === 'device-archive-inactive')) {
			dependencies.report.warn({
				code: 'ongoing_archive_job_missing',
				message:
					'The current migration journal does not install the inactive-device archive job; deploy it separately after cutover',
			})
		}
	} else if (!config.dryRun && !config.manageJobs) {
		dependencies.report.warn({
			severity: 'high',
			code: 'automatic_background_job_management_disabled',
			message:
				'Timescale retention/refresh and pg_cron jobs must be paused and restored by the cutover operator',
		})
	}

	for (const phase of PHASES.filter((item) => config.phases.includes(item))) {
		throwIfAborted(dependencies)
		if (phase === 'preflight') {
			const result = newPhaseResult('preflight')
			result.sourceSeen = snapshot.users.length + snapshot.boxes.length
			result.written =
				snapshot.retainedUserIds.size + snapshot.migratableDeviceIds.size
			result.rejected = snapshot.anomalies.length
			if (!config.dryRun) {
				await dependencies.app.savePhaseProgress(
					config.runId,
					result,
					'completed',
					null,
				)
			}
			dependencies.report.addPhase(result)
			continue
		}
		let progress = config.dryRun
			? null
			: await dependencies.app.phaseProgress(config.runId, phase)
		if (progress?.status === 'completed') {
			const result: PhaseResult = {
				phase,
				sourceSeen: progress.sourceSeen,
				written: progress.written,
				skipped: progress.skipped,
				rejected: progress.rejected,
				details: { resumedFromCompletedPhase: true },
			}
			dependencies.report.addPhase(result)
			dependencies.logger.info(`Reused completed ${phase} phase`, result)
			continue
		}
		if (!config.dryRun && !progress) {
			const initial = newPhaseResult(phase)
			await dependencies.app.savePhaseProgress(
				config.runId,
				initial,
				'running',
				null,
			)
			progress = {
				...initial,
				status: 'running',
				cursor: null,
			}
		}
		dependencies.logger.info(`Starting ${phase} phase`)
		let result: PhaseResult
		switch (phase) {
			case 'accounts':
				result = await accountsPhase(config, dependencies, snapshot, progress)
				break
			case 'devices':
				result = await devicesPhase(config, dependencies, snapshot, progress)
				break
			case 'measurements':
				result = await measurementsPhase(
					config,
					dependencies,
					snapshot,
					progress,
				)
				break
			case 'integrations':
				result = await integrationsPhase(
					config,
					dependencies,
					snapshot,
					progress,
				)
				break
			case 'media':
				result = await mediaPhase(config, dependencies, snapshot, progress)
				break
			case 'finalize':
				result = await finalizePhase(config, dependencies)
				break
			case 'validate':
				result = await validatePhase(config, dependencies, snapshot, progress)
				break
		}
		if (!config.dryRun) {
			const latest = await dependencies.app.phaseProgress(config.runId, phase)
			await dependencies.app.savePhaseProgress(
				config.runId,
				result,
				'completed',
				latest?.cursor ?? null,
			)
		}
		dependencies.report.addPhase(result)
		dependencies.logger.info(`Completed ${phase} phase`, result)
	}
}

export const migrationInternals = {
	authenticatedCredentialInventory,
	snapshotSha256,
	fatalSourceAnomalies,
	selectDeviceApiKey,
	validateMongoSourceCompatibility,
	validateApiKeyPolicy,
	preservedApiKeyMismatches,
	expectedSourceDerivedEntities,
	existingValueMismatches,
	assertExactPrefix,
	assertProgressBoundary,
	devicesPhase,
	measurementsPhase,
	integrationsPhase,
	mediaPhase,
	validatePhase,
}
