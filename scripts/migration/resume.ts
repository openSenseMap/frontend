import { canonicalValue } from './canonical'
import { type MigrationDependencies } from './context'
import { legacyAccessToken } from './device-credentials'
import {
	type MigrationConfig,
	type PhaseProgress,
	type PhaseResult,
	type SourceSnapshot,
} from './types'
import { expectedSourceDerivedEntities } from './validation'

/**
 * Requires existing rows to be an exact prefix of stable source order, preventing
 * resume from accepting unrelated or out-of-order target data.
 */
export function assertExactPrefix(
	expectedIds: string[],
	actualIds: string[],
	label: string,
) {
	const expectedPrefix = expectedIds.slice(0, actualIds.length)
	if (canonicalValue(actualIds) !== canonicalValue(expectedPrefix)) {
		throw new Error(
			`Existing ${label} rows are not the deterministic prefix recorded by the interrupted run`,
		)
	}
}

/**
 * Reconciles an exact target prefix with its durable cursor, allowing only the one
 * uncheckpointed row possible when a process dies between commit and checkpoint.
 */
export function assertProgressBoundary(
	expectedIds: string[],
	actualIds: string[],
	progress: PhaseProgress | null,
	label: string,
) {
	assertExactPrefix(expectedIds, actualIds, label)
	if (!progress) return

	let checkpointCount = 0
	if (progress.status === 'completed') {
		checkpointCount = expectedIds.length
	} else if (typeof progress.cursor?.key === 'string') {
		const checkpointIndex = expectedIds.indexOf(progress.cursor.key)
		if (checkpointIndex === -1) {
			throw new Error(
				`${label} resume cursor does not exist in the current source snapshot`,
			)
		}
		checkpointCount = checkpointIndex + 1
	}

	// A hard process failure can commit one entity immediately before its
	// separate progress checkpoint. That one row is deliberately replayed and
	// exact-compared. Anything farther ahead cannot have been produced by this
	// sequential phase execution.
	const maximumCount =
		progress.status === 'running'
			? Math.min(expectedIds.length, checkpointCount + 1)
			: checkpointCount
	if (actualIds.length < checkpointCount || actualIds.length > maximumCount) {
		throw new Error(
			`Existing ${label} rows do not match the durable phase checkpoint`,
		)
	}
}

/** Checks only already-written rows against source values during resume bootstrap. */
export function existingValueMismatches(
	expected: ReadonlyMap<string, unknown>,
	actualRows: Array<{ id: string; value: Record<string, unknown> }>,
) {
	return actualRows
		.filter(
			({ id, value }) =>
				!expected.has(id) ||
				canonicalValue(expected.get(id)) !== canonicalValue(value),
		)
		.map(({ id }) => id)
}

/**
 * Validates an interrupted target in depth and reconstructs missing account/device
 * checkpoints from deterministic prefixes. It never guesses measurement or
 * integration progress because those writes cannot be proven from row counts alone.
 */
export async function bootstrapLegacyResumeProgress(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	if (!config.resume || config.dryRun) return
	const [
		accountProgress,
		deviceProgress,
		measurementProgress,
		integrationProgress,
	] = await Promise.all([
		dependencies.app.phaseProgress(config.runId, 'accounts'),
		dependencies.app.phaseProgress(config.runId, 'devices'),
		dependencies.app.phaseProgress(config.runId, 'measurements'),
		dependencies.app.phaseProgress(config.runId, 'integrations'),
	])
	const [actual, apiKeys, counts, stateCounts, mqttRows, ttnRows] =
		await Promise.all([
			dependencies.app.sourceDerivedEntityRows(config.runId),
			dependencies.app.deviceApiKeys(config.runId),
			dependencies.app.resumeDataCounts(),
			dependencies.app.resumeMetadataInvariantCounts(config.runId, config.to),
			dependencies.mqtt?.configurationRows() ?? [],
			dependencies.ttn?.configurationRows() ?? [],
		])
	const expected = expectedSourceDerivedEntities(snapshot)
	const expectedUserIds = [...expected.users.keys()].sort()
	const actualUserIds = actual.users.map(({ id }) => id).sort()
	assertProgressBoundary(
		expectedUserIds,
		actualUserIds,
		accountProgress,
		'account',
	)
	const userMismatches = existingValueMismatches(expected.users, actual.users)
	if (userMismatches.length > 0) {
		throw new Error(
			`Existing resumed accounts do not match source: ${userMismatches.slice(0, 20).join(', ')}`,
		)
	}

	const expectedDeviceIds = [...expected.devices.keys()].sort()
	const actualDeviceIds = actual.devices.map(({ id }) => id).sort()
	assertProgressBoundary(
		expectedDeviceIds,
		actualDeviceIds,
		deviceProgress,
		'device',
	)
	const deviceMismatches = existingValueMismatches(
		expected.devices,
		actual.devices,
	)
	if (deviceMismatches.length > 0) {
		throw new Error(
			`Existing resumed devices do not match source: ${deviceMismatches.slice(0, 20).join(', ')}`,
		)
	}
	if (
		(!accountProgress || !deviceProgress) &&
		(stateCounts.devices > 0 || stateCounts.sensors > 0)
	) {
		throw new Error(
			`Existing resume metadata is not in an unfinished devices-phase state: devices=${stateCounts.devices}, sensors=${stateCounts.sensors}`,
		)
	}

	const existingDeviceIds = new Set(actualDeviceIds)
	const expectedSensors = new Map(
		[...expected.sensors].filter(([, value]) => {
			const deviceId = (value as Record<string, unknown>).deviceId
			return typeof deviceId === 'string' && existingDeviceIds.has(deviceId)
		}),
	)
	const sensorMismatches = existingValueMismatches(
		expectedSensors,
		actual.sensors,
	)
	const actualSensorIds = actual.sensors.map(({ id }) => id).sort()
	const expectedSensorIds = [...expectedSensors.keys()].sort()
	if (
		sensorMismatches.length > 0 ||
		canonicalValue(actualSensorIds) !== canonicalValue(expectedSensorIds)
	) {
		throw new Error(
			`Existing resumed sensors do not match their committed devices: ${sensorMismatches.slice(0, 20).join(', ')}`,
		)
	}
	for (const deviceId of actualDeviceIds) {
		if (
			canonicalValue(actual.locations.get(deviceId) ?? []) !==
			canonicalValue(expected.locations.get(deviceId) ?? [])
		) {
			throw new Error(
				`Existing resumed locations for device ${deviceId} do not match source`,
			)
		}
	}

	const seenApiKeys = new Set<string>()
	for (const deviceId of actualDeviceIds) {
		const actualKey = apiKeys.get(deviceId)
		const sourceKey = legacyAccessToken(snapshot.boxById.get(deviceId)!)
		if (
			typeof actualKey !== 'string' ||
			actualKey.length === 0 ||
			(sourceKey !== null && actualKey !== sourceKey) ||
			seenApiKeys.has(actualKey)
		) {
			throw new Error(
				`Existing resumed API key for device ${deviceId} is missing, changed, or duplicated`,
			)
		}
		seenApiKeys.add(actualKey)
	}

	if (
		actualDeviceIds.length > 0 &&
		actualUserIds.length !== expectedUserIds.length
	) {
		throw new Error(
			'Devices exist but the interrupted accounts phase is incomplete',
		)
	}
	if (!measurementProgress && counts.measurements > 0) {
		throw new Error(
			'Existing measurements have no durable resume cursor; recreate the targets rather than guessing a checkpoint',
		)
	}
	if (!integrationProgress && (mqttRows.length > 0 || ttnRows.length > 0)) {
		throw new Error(
			'Existing integrations have no durable resume cursor; recreate the targets rather than guessing a checkpoint',
		)
	}

	if (!accountProgress && actualUserIds.length > 0) {
		const result: PhaseResult = {
			phase: 'accounts',
			sourceSeen: actualUserIds.length,
			written: actualUserIds.length,
			skipped: 0,
			rejected: 0,
		}
		await dependencies.app.savePhaseProgress(
			config.runId,
			result,
			actualUserIds.length === expectedUserIds.length ? 'completed' : 'running',
			{ key: actualUserIds.at(-1)! },
		)
	}
	if (!deviceProgress && actualDeviceIds.length > 0) {
		const result: PhaseResult = {
			phase: 'devices',
			sourceSeen: actualDeviceIds.length,
			written: actualDeviceIds.length,
			skipped: 0,
			rejected: 0,
		}
		await dependencies.app.savePhaseProgress(
			config.runId,
			result,
			actualDeviceIds.length === expectedDeviceIds.length
				? 'completed'
				: 'running',
			{ key: actualDeviceIds.at(-1)! },
		)
	}
	Object.assign(dependencies.report.preflight, {
		resumeBootstrap: {
			accounts: actualUserIds.length,
			devices: actualDeviceIds.length,
			sensors: counts.sensors,
			measurements: counts.measurements,
		},
	})
}
