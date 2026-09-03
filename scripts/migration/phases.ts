import { ORPHAN_USER_ID } from './app-target'
import { type MigrationDependencies } from './context'
import { legacyAccessToken, selectDeviceApiKey } from './device-credentials'
import {
	legacyId,
	transformDevice,
	transformMeasurement,
	transformMqttIntegration,
	transformTtnIntegration,
	transformUser,
} from './domain/transforms'
import { CAGGS, validSensorIds } from './preflight'
import {
	type MigrationConfig,
	type MigratedMeasurement,
	type Phase,
	type PhaseProgress,
	type PhaseResult,
	type SourceSnapshot,
} from './types'

/** Stops at explicit phase boundaries and inside long loops when the caller aborts. */
export function throwIfAborted(dependencies: MigrationDependencies) {
	dependencies.signal?.throwIfAborted()
}

/** Creates phase counters, carrying forward durable counts when a run resumes. */
export function newPhaseResult(
	phase: Phase,
	progress?: PhaseProgress | null,
): PhaseResult {
	return {
		phase,
		sourceSeen: progress?.sourceSeen ?? 0,
		written: progress?.written ?? 0,
		skipped: progress?.skipped ?? 0,
		rejected: progress?.rejected ?? 0,
	}
}

/** Extracts the deterministic entity key used by sequential phase checkpoints. */
function progressKey(progress?: PhaseProgress | null) {
	return typeof progress?.cursor?.key === 'string' ? progress.cursor.key : null
}

/**
 * Persists counters and a resume cursor after durable work; dry runs deliberately
 * keep no checkpoint state.
 */
export async function checkpoint(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	result: PhaseResult,
	cursor: Record<string, unknown>,
) {
	if (!config.dryRun) {
		await dependencies.app.savePhaseProgress(
			config.runId,
			result,
			'running',
			cursor,
		)
	}
}

/**
 * Migrates retained users in stable ID order. Each committed user is followed by a
 * checkpoint, making a restart deterministic and safe to compare/replay.
 */
export async function accountsPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	progress?: PhaseProgress | null,
) {
	const result = newPhaseResult('accounts', progress)
	const lastKey = progressKey(progress)
	await dependencies.app.ensureOrphanUser()

	const users = snapshot.users
		.map((user) => ({ id: legacyId(user._id), user }))
		.filter(
			(item): item is { id: string; user: (typeof snapshot.users)[number] } =>
				Boolean(item.id && snapshot.retainedUserIds.has(item.id)),
		)
		.sort((a, b) => a.id.localeCompare(b.id))

	for (const { id, user } of users) {
		if (lastKey && id <= lastKey) continue
		throwIfAborted(dependencies)
		result.sourceSeen++
		const transformed = transformUser(user)
		if (!transformed.ok) {
			result.rejected++
			await dependencies.app.reject(config.runId, {
				phase: 'accounts',
				sourceCollection: 'users',
				sourceId: id,
				code: transformed.code,
				details: transformed.details,
			})
			await checkpoint(config, dependencies, result, { key: id })
			continue
		}
		await dependencies.app.insertUser(transformed.value)
		result.written++
		await checkpoint(config, dependencies, result, { key: id })
	}
	return result
}

/**
 * Migrates each device atomically with its sensors and policy-filtered locations
 * (full history for mobile, latest valid location otherwise), preserving ownership
 * and legacy API keys before advancing the device cursor.
 */
export async function devicesPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	progress?: PhaseProgress | null,
) {
	const result = newPhaseResult('devices', progress)
	const lastKey = progressKey(progress)
	const sensorIds = validSensorIds(snapshot)
	const deviceIds = [...snapshot.migratableDeviceIds].sort()

	for (const deviceId of deviceIds) {
		if (lastKey && deviceId <= lastKey) continue
		throwIfAborted(dependencies)
		result.sourceSeen++
		const box = snapshot.boxById.get(deviceId)!
		const ownerId = snapshot.ownerByDeviceId.get(deviceId) ?? ORPHAN_USER_ID
		const transformed = transformDevice(
			box,
			ownerId,
			sensorIds,
			snapshot.sensorTargetIdByOccurrence,
		)
		if (!transformed.ok) {
			result.rejected++
			await dependencies.app.reject(config.runId, {
				phase: 'devices',
				sourceCollection: 'boxes',
				sourceId: deviceId,
				code: transformed.code,
				details: transformed.details,
			})
			await checkpoint(config, dependencies, result, { key: deviceId })
			continue
		}
		for (const warning of transformed.warnings) {
			await dependencies.app.reject(config.runId, {
				phase: 'devices',
				sourceCollection: 'boxes',
				sourceId: deviceId,
				code: `warning_${warning}`,
			})
		}
		const preservedApiKey = legacyAccessToken(box)
		const apiKey = preservedApiKey ?? selectDeviceApiKey(box)
		await dependencies.app.insertDevice(
			transformed.value,
			apiKey,
			config.to,
			preservedApiKey,
		)
		result.written++
		await checkpoint(config, dependencies, result, { key: deviceId })
	}
	return result
}

/** Writes one accumulated measurement batch and folds its outcome into phase totals. */
async function flushMeasurementBatch(args: {
	dependencies: MigrationDependencies
	result: PhaseResult
	batch: MigratedMeasurement[]
}) {
	const inserted = await args.dependencies.app.insertMeasurementBatch(
		args.batch,
	)
	args.result.written += inserted.written
	args.result.skipped += inserted.skipped
	args.batch.length = 0
}

/**
 * Streams measurements by sensor and timestamp, keeps at most one source row per
 * sensor/timestamp, and checkpoints only after a batch is durably written.
 */
export async function measurementsPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	progress?: PhaseProgress | null,
) {
	const result = newPhaseResult('measurements', progress)
	const resumeSensorId =
		typeof progress?.cursor?.sensorId === 'string'
			? progress.cursor.sensorId
			: null
	const resumeTime =
		typeof progress?.cursor?.time === 'string'
			? new Date(progress.cursor.time)
			: null
	const resumeSensorComplete = progress?.cursor?.sensorComplete === true
	for (const sensorId of [...validSensorIds(snapshot)].sort()) {
		if (
			resumeSensorId &&
			(sensorId < resumeSensorId ||
				(sensorId === resumeSensorId && resumeSensorComplete))
		) {
			continue
		}
		throwIfAborted(dependencies)
		const batch: MigratedMeasurement[] = []
		let sinceFlush = 0
		let lastTime: Date | null =
			sensorId === resumeSensorId &&
			resumeTime &&
			Number.isFinite(resumeTime.getTime())
				? resumeTime
				: null
		for await (const sourceGroup of dependencies.source.measurementGroupsForSensor(
			sensorId,
			config.from,
			config.to,
			lastTime ?? undefined,
		)) {
			throwIfAborted(dependencies)
			result.sourceSeen += sourceGroup.length
			sinceFlush += sourceGroup.length
			let accepted = false
			lastTime = new Date(String(sourceGroup[0]?.createdAt))
			for (const sourceMeasurement of sourceGroup) {
				const sourceId = legacyId(sourceMeasurement._id)
				const transformed = transformMeasurement(
					sourceMeasurement,
					sensorId,
					config.from,
					config.to,
				)
				if (!transformed.ok) {
					result.rejected++
					await dependencies.app.reject(config.runId, {
						phase: 'measurements',
						sourceCollection: 'measurements',
						sourceId: sourceId ?? undefined,
						code: transformed.code,
						details: transformed.details,
					})
					continue
				}
				if (accepted) {
					result.skipped++
					await dependencies.app.reject(config.runId, {
						phase: 'measurements',
						sourceCollection: 'measurements',
						sourceId: sourceId ?? undefined,
						code: 'duplicate_measurement_timestamp',
						details: { sensorId },
					})
					continue
				}
				accepted = true
				batch.push(transformed.value)
			}
			if (sinceFlush >= config.batchSize) {
				await flushMeasurementBatch({ dependencies, result, batch })
				sinceFlush = 0
				await checkpoint(config, dependencies, result, {
					sensorId,
					time: lastTime.toISOString(),
					sensorComplete: false,
				})
			}
		}
		if (batch.length > 0) {
			await flushMeasurementBatch({ dependencies, result, batch })
		}
		await checkpoint(config, dependencies, result, {
			sensorId,
			sensorComplete: true,
		})
	}
	return result
}

/**
 * Transforms MQTT and TTN settings independently per device, auditing malformed
 * settings while checkpointing only after both integration decisions are complete.
 */
export async function integrationsPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	progress?: PhaseProgress | null,
) {
	if (!dependencies.mqtt || !dependencies.ttn) {
		throw new Error('Integration targets were not configured')
	}
	const result = newPhaseResult('integrations', progress)
	const lastKey = progressKey(progress)
	for (const deviceId of [...snapshot.migratableDeviceIds].sort()) {
		if (lastKey && deviceId <= lastKey) continue
		throwIfAborted(dependencies)
		result.sourceSeen++
		const box = snapshot.boxById.get(deviceId)!
		const mqtt = transformMqttIntegration(
			deviceId,
			box.integrations?.mqtt ?? box.mqtt,
		)
		const ttn = transformTtnIntegration(deviceId, box.integrations?.ttn)
		for (const [kind, transformed] of [
			['mqtt', mqtt],
			['ttn', ttn],
		] as const) {
			if (!transformed.ok) {
				result.rejected++
				await dependencies.app.reject(config.runId, {
					phase: 'integrations',
					sourceCollection: 'boxes',
					sourceId: deviceId,
					code: `${kind}_${transformed.code}`,
					details: transformed.details,
				})
				continue
			}
			if (!transformed.value) {
				result.skipped++
				continue
			}
			if (kind === 'mqtt') {
				await dependencies.mqtt.insertMqtt(transformed.value, config.to)
			} else {
				await dependencies.ttn.insertTtn(transformed.value, config.to)
			}
			result.written++
		}
		await checkpoint(config, dependencies, result, { key: deviceId })
	}
	return result
}

/**
 * Copies referenced device images to object storage and records a content-addressed
 * audit row, or reports all image references as skipped when media is disabled.
 */
export async function mediaPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	progress?: PhaseProgress | null,
) {
	if (config.skipImages) {
		const result = newPhaseResult('media')
		result.sourceSeen = [...snapshot.migratableDeviceIds].filter((deviceId) => {
			const image = snapshot.boxById.get(deviceId)?.image
			return typeof image === 'string' && Boolean(image.trim())
		}).length
		result.skipped = result.sourceSeen
		result.details = { reason: 'MIGRATION_SKIP_IMAGES=true' }
		return result
	}
	if (!dependencies.images || !config.s3) {
		throw new Error('Media source/S3 target was not configured')
	}
	const result = newPhaseResult('media', progress)
	const lastKey = progressKey(progress)
	for (const deviceId of [...snapshot.migratableDeviceIds].sort()) {
		if (lastKey && deviceId <= lastKey) continue
		throwIfAborted(dependencies)
		const box = snapshot.boxById.get(deviceId)!
		if (typeof box.image !== 'string' || !box.image.trim()) continue
		result.sourceSeen++
		try {
			const asset = await dependencies.images.prepare(
				deviceId,
				box.image.trim(),
			)
			const uploaded = await dependencies.images.put(asset)
			await dependencies.app.recordAsset({
				runId: config.runId,
				sourcePath: asset.sourcePath,
				deviceId,
				bucket: config.s3.bucket,
				key: asset.key,
				sha256: asset.sha256,
				bytes: asset.bytes,
				status: uploaded.status,
				etag: uploaded.etag,
			})
			await dependencies.app.updateDeviceImage(deviceId, asset.key)
			if (uploaded.status === 'skipped') result.skipped++
			else result.written++
			await checkpoint(config, dependencies, result, { key: deviceId })
		} catch (error) {
			result.rejected++
			await dependencies.app.reject(config.runId, {
				phase: 'media',
				sourceCollection: 'boxes',
				sourceId: deviceId,
				code: 'device_image_failed',
				details: {
					message: error instanceof Error ? error.message : String(error),
				},
			})
			throw error
		}
	}
	return result
}

/**
 * Derives sensor/device lifecycle state from migrated measurements, disables
 * integrations for archived devices, and optionally refreshes Timescale aggregates.
 */
export async function finalizePhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
) {
	const result = newPhaseResult('finalize')
	await dependencies.app.finalize(
		config.runId,
		config.from,
		config.to,
		config.archiveBefore,
	)
	if (config.dryRun) {
		result.skipped = 1
		return result
	}
	const archivedIds = await dependencies.app.archivedDeviceIds(config.runId)
	await dependencies.mqtt?.disableDevices(archivedIds, config.to)
	await dependencies.ttn?.disableDevices(archivedIds, config.to)
	const activeAuthenticatedOrphans =
		await dependencies.app.activeAuthenticatedOrphanDeviceIds(config.runId)
	if (activeAuthenticatedOrphans.length > 0) {
		dependencies.report.warn({
			severity: 'high',
			code: 'active_authenticated_orphans_need_reconfiguration',
			count: activeAuthenticatedOrphans.length,
			deviceIds: activeAuthenticatedOrphans,
		})
	}
	result.written = 1

	if (config.refreshAggregates) {
		for (const view of CAGGS) {
			await dependencies.app.refreshContinuousAggregate(
				view,
				config.from,
				config.to,
			)
		}
	}
	return result
}
