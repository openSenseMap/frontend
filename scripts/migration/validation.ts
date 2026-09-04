import { createHash } from 'node:crypto'
import { ORPHAN_USER_ID } from './app-target'
import { canonicalValue } from './canonical'
import { type MigrationDependencies } from './context'
import { preservedApiKeyMismatches } from './device-credentials'
import {
	transformDevice,
	transformMeasurement,
	transformMqttIntegration,
	transformTtnIntegration,
	transformUser,
} from './domain/transforms'
import { checkpoint, newPhaseResult, throwIfAborted } from './phases'
import { CAGGS, expectedEntityIds, validSensorIds } from './preflight'
import {
	type MigrationConfig,
	type PhaseProgress,
	type PhaseResult,
	type SourceSnapshot,
} from './types'

type MeasurementDigest = {
	count: number
	sha256: string
	rejected?: number
	duplicates?: number
}

/** Adds one canonical measurement tuple to an order-sensitive validation digest. */
function updateMeasurementDigest(
	hash: ReturnType<typeof createHash>,
	row: {
		sensorId: string
		time: Date
		value: number
		location: { longitude: number; latitude: number } | null
	},
) {
	const normalize = (value: number) => (Object.is(value, -0) ? 0 : value)
	hash.update(
		`${JSON.stringify([
			row.sensorId,
			row.time.getTime(),
			normalize(row.value),
			row.location
				? [normalize(row.location.longitude), normalize(row.location.latitude)]
				: null,
		])}\n`,
	)
}

/**
 * Replays the source transformation rules for one sensor to calculate the expected
 * count and digest, including rejected and duplicate-row accounting.
 */
async function sourceMeasurementDigest(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	sensorId: string,
): Promise<MeasurementDigest> {
	const hash = createHash('sha256')
	let count = 0
	let rejected = 0
	let duplicates = 0
	for await (const group of dependencies.source.measurementGroupsForSensor(
		sensorId,
		config.from,
		config.to,
	)) {
		let accepted = false
		for (const sourceMeasurement of group) {
			const transformed = transformMeasurement(
				sourceMeasurement,
				sensorId,
				config.from,
				config.to,
			)
			if (!transformed.ok) {
				rejected++
				continue
			}
			if (accepted) {
				duplicates++
				continue
			}
			accepted = true
			updateMeasurementDigest(hash, transformed.value)
			count++
		}
	}
	return { count, sha256: hash.digest('hex'), rejected, duplicates }
}

/** Calculates the corresponding ordered count and digest from migrated PostgreSQL rows. */
async function targetMeasurementDigest(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	sensorId: string,
): Promise<MeasurementDigest> {
	const hash = createHash('sha256')
	let count = 0
	for await (const row of dependencies.app.measurementsForSensor(
		sensorId,
		config.from,
		config.to,
	)) {
		updateMeasurementDigest(hash, {
			sensorId: row.sensorId,
			time: row.time,
			value: row.value,
			location:
				row.longitude === null || row.latitude === null
					? null
					: { longitude: row.longitude, latitude: row.latitude },
		})
		count++
	}
	return { count, sha256: hash.digest('hex') }
}

/**
 * Compares source and target measurements sensor by sensor and stores durable
 * manifests, allowing this expensive validation pass itself to resume safely.
 */
async function validateMeasurementManifests(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	progress: PhaseProgress | null | undefined,
	phaseResult: PhaseResult,
) {
	const sensorIds = [...validSensorIds(snapshot)].sort()
	const cursorStage =
		typeof progress?.cursor?.stage === 'string' ? progress.cursor.stage : null
	const cursorKey =
		typeof progress?.cursor?.key === 'string' ? progress.cursor.key : null
	const completedManifests = cursorStage === 'measurement-manifests-complete'
	const lastCompletedKey = completedManifests ? sensorIds.at(-1) : cursorKey
	const priorRows = lastCompletedKey
		? (await dependencies.app.manifestRows(config.runId, 'measurement')).filter(
				(row) => row.partitionKey <= lastCompletedKey,
			)
		: []
	const expectedPriorCount = lastCompletedKey
		? sensorIds.filter((sensorId) => sensorId <= lastCompletedKey).length
		: 0
	if (priorRows.length !== expectedPriorCount) {
		throw new Error(
			'Measurement validation checkpoint does not match its durable manifests',
		)
	}
	let expected = priorRows.reduce((total, row) => total + row.expectedCount, 0)
	let actual = priorRows.reduce(
		(total, row) => total + (row.targetCount ?? 0),
		0,
	)
	const mismatches: string[] = []
	let mismatchCount = priorRows.filter(
		(row) => row.details.matches !== true,
	).length
	for (const row of priorRows) {
		if (row.details.matches !== true && mismatches.length < 100) {
			mismatches.push(row.partitionKey)
		}
	}
	for (const [index, sensorId] of sensorIds.entries()) {
		if (lastCompletedKey && sensorId <= lastCompletedKey) continue
		throwIfAborted(dependencies)
		const source = await sourceMeasurementDigest(config, dependencies, sensorId)
		const target = await targetMeasurementDigest(config, dependencies, sensorId)
		expected += source.count
		actual += target.count
		const matches =
			source.count === target.count && source.sha256 === target.sha256
		if (!matches) {
			mismatchCount++
			if (mismatches.length < 100) mismatches.push(sensorId)
		}
		await dependencies.app.saveManifest({
			runId: config.runId,
			entity: 'measurement',
			partitionKey: sensorId,
			expectedCount: source.count,
			sourceSha256: source.sha256,
			targetCount: target.count,
			targetSha256: target.sha256,
			details: {
				rejected: source.rejected ?? 0,
				duplicates: source.duplicates ?? 0,
				matches,
			},
		})
		await checkpoint(config, dependencies, phaseResult, {
			stage: 'measurement-manifests',
			key: sensorId,
		})
		if ((index + 1) % 100 === 0) {
			dependencies.logger.info('Validated measurement partitions', {
				completed: index + 1,
				total: sensorIds.length,
			})
		}
	}
	await checkpoint(config, dependencies, phaseResult, {
		stage: 'measurement-manifests-complete',
	})
	return {
		expected,
		actual,
		mismatchCount,
		mismatchSensorIds: mismatches,
	}
}

/**
 * Verifies each expected image across object contents, the device reference, and
 * the migration audit record; returned mismatch samples are bounded for reports.
 */
async function validateMedia(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	expectedIds: string[],
) {
	if (expectedIds.length === 0) {
		return { expected: 0, mismatchCount: 0, mismatches: [] as string[] }
	}
	if (!dependencies.images) {
		return {
			expected: expectedIds.length,
			mismatchCount: expectedIds.length,
			mismatches: expectedIds.slice(0, 100),
		}
	}
	const mismatches: string[] = []
	let mismatchCount = 0
	for (const deviceId of expectedIds) {
		throwIfAborted(dependencies)
		try {
			const box = snapshot.boxById.get(deviceId)!
			const asset = await dependencies.images.prepare(
				deviceId,
				String(box.image).trim(),
			)
			const [objectMatches, imageKey, auditMatches] = await Promise.all([
				dependencies.images.verify(asset),
				dependencies.app.deviceImageKey(deviceId),
				dependencies.app.assetMatches({
					runId: config.runId,
					deviceId,
					key: asset.key,
					sha256: asset.sha256,
					bytes: asset.bytes,
				}),
			])
			if (!objectMatches || imageKey !== asset.key || !auditMatches) {
				mismatchCount++
				if (mismatches.length < 100) mismatches.push(deviceId)
			}
		} catch {
			mismatchCount++
			if (mismatches.length < 100) mismatches.push(deviceId)
		}
	}
	return { expected: expectedIds.length, mismatchCount, mismatches }
}

/**
 * Reconstructs the post-finalization MQTT/TTN rows expected from the snapshot,
 * including forced disabling for devices that were archived at the cutoff.
 */
function expectedIntegrationConfigurations(
	snapshot: SourceSnapshot,
	archivedDeviceIds: ReadonlySet<string>,
	cutoff: Date,
) {
	const mqtt = new Map<string, Record<string, unknown>>()
	const ttn = new Map<string, Record<string, unknown>>()
	for (const deviceId of snapshot.migratableDeviceIds) {
		const box = snapshot.boxById.get(deviceId)!
		const mqttResult = transformMqttIntegration(
			deviceId,
			box.integrations?.mqtt ?? box.mqtt,
		)
		if (mqttResult.ok && mqttResult.value) {
			const { deviceId: _deviceId, ...value } = mqttResult.value
			mqtt.set(deviceId, {
				...value,
				enabled: archivedDeviceIds.has(deviceId) ? false : value.enabled,
				createdAt: cutoff,
				updatedAt: cutoff,
			})
		}
		const ttnResult = transformTtnIntegration(deviceId, box.integrations?.ttn)
		if (ttnResult.ok && ttnResult.value) {
			const { deviceId: _deviceId, ...value } = ttnResult.value
			ttn.set(deviceId, {
				...value,
				enabled: archivedDeviceIds.has(deviceId) ? false : value.enabled,
				createdAt: cutoff,
				updatedAt: cutoff,
			})
		}
	}
	return { mqtt, ttn }
}

/** Returns device IDs whose integration configuration differs canonically. */
function configurationMismatches(
	expected: ReadonlyMap<string, Record<string, unknown>>,
	actualRows: Array<{ deviceId: string; value: Record<string, unknown> }>,
) {
	const actual = new Map(actualRows.map((row) => [row.deviceId, row.value]))
	return [...expected]
		.filter(
			([deviceId, value]) =>
				canonicalValue(value) !== canonicalValue(actual.get(deviceId)),
		)
		.map(([deviceId]) => deviceId)
}

/**
 * Reapplies pure transforms to build canonical expected users, devices, sensors,
 * and policy-retained locations for resume verification and final validation.
 */
export function expectedSourceDerivedEntities(snapshot: SourceSnapshot) {
	const users = new Map<string, Record<string, unknown>>()
	const devices = new Map<string, Record<string, unknown>>()
	const sensors = new Map<string, Record<string, unknown>>()
	const locations = new Map<
		string,
		Array<{ longitude: number; latitude: number; time: Date }>
	>()
	for (const user of snapshot.users) {
		const transformed = transformUser(user)
		if (
			!transformed.ok ||
			!snapshot.retainedUserIds.has(transformed.value.id)
		) {
			continue
		}
		const value = transformed.value
		users.set(value.id, {
			name: value.name,
			email: value.email,
			unconfirmedEmail: null,
			themePreference: 'system',
			role: value.role,
			language: value.language,
			emailIsConfirmed: value.emailIsConfirmed,
			newsletterOptIn: false,
			createdAt: value.createdAt,
			updatedAt: value.updatedAt,
			passwordHash: value.passwordHash,
			profileId: value.profileId,
			displayName: value.displayName,
			profilePublic: false,
		})
	}
	const validIds = validSensorIds(snapshot)
	for (const deviceId of snapshot.migratableDeviceIds) {
		const transformed = transformDevice(
			snapshot.boxById.get(deviceId)!,
			snapshot.ownerByDeviceId.get(deviceId) ?? ORPHAN_USER_ID,
			validIds,
			snapshot.sensorTargetIdByOccurrence,
		)
		if (!transformed.ok) continue
		const value = transformed.value
		devices.set(deviceId, {
			name: value.name,
			website: null,
			description: value.description,
			tags: value.tags,
			link: value.link,
			useAuth: value.useAuth,
			exposure: value.exposure,
			model: value.model,
			public: value.public,
			createdAt: value.createdAt,
			updatedAt: value.updatedAt,
			latitude: value.latitude,
			longitude: value.longitude,
			heightAboveGround: value.heightAboveGround,
			terrainElevation: null,
			terrainElevationDataset: null,
			userId: value.userId,
			deviceSchemaVersionId: null,
		})
		locations.set(deviceId, value.locations)
		for (const sensor of value.sensors) {
			sensors.set(sensor.id, {
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				createdAt: value.createdAt,
				updatedAt: value.updatedAt,
				deviceId,
				order: sensor.order,
			})
		}
	}
	return { users, devices, sensors, locations }
}

/** Finds missing or value-different target entities using canonical serialization. */
function entityValueMismatches(
	expected: ReadonlyMap<string, unknown>,
	actualRows: Array<{ id: string; value: Record<string, unknown> }>,
) {
	const actual = new Map(actualRows.map((row) => [row.id, row.value]))
	return [...expected]
		.filter(
			([id, value]) => canonicalValue(value) !== canonicalValue(actual.get(id)),
		)
		.map(([id]) => id)
}

/**
 * Performs end-to-end value, relationship, manifest, aggregate, and lifecycle
 * checks; background jobs are restored only after every validation passes.
 */
export async function validatePhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	progress?: PhaseProgress | null,
) {
	if (config.dryRun) {
		dependencies.report.validation = {
			status: 'skipped_for_dry_run',
			reason: 'No target rows are written during a dry run',
		}
		const result = newPhaseResult('validate')
		result.skipped = 1
		return result
	}
	const result = newPhaseResult('validate', progress)
	const expectedEntities = expectedEntityIds(snapshot, !config.skipImages)
	const measurementManifest = await validateMeasurementManifests(
		config,
		dependencies,
		snapshot,
		progress,
		result,
	)
	const mediaValidation = config.skipImages
		? {
				expected: 0,
				mismatchCount: 0,
				mismatches: [] as string[],
				status: 'skipped' as const,
			}
		: await validateMedia(
				config,
				dependencies,
				snapshot,
				expectedEntities.media,
			)
	const validation = await dependencies.app.validation(
		config.runId,
		config.from,
		config.to,
		config.archiveBefore,
	)
	const [
		appDeviceIds,
		targetOwners,
		targetSensorDevices,
		archivedDeviceIds,
		targetSourceDerived,
		targetApiKeys,
	] = await Promise.all([
		dependencies.app.deviceIds(config.runId),
		dependencies.app.deviceOwners(config.runId),
		dependencies.app.sensorDevices(config.runId),
		dependencies.app.archivedDeviceIds(config.runId),
		dependencies.app.sourceDerivedEntityRows(config.runId),
		dependencies.app.deviceApiKeys(config.runId),
	])
	const expectedSourceDerived = expectedSourceDerivedEntities(snapshot)
	const userValueMismatches = entityValueMismatches(
		expectedSourceDerived.users,
		targetSourceDerived.users,
	)
	const deviceValueMismatches = entityValueMismatches(
		expectedSourceDerived.devices,
		targetSourceDerived.devices,
	)
	const sensorValueMismatches = entityValueMismatches(
		expectedSourceDerived.sensors,
		targetSourceDerived.sensors,
	)
	const locationValueMismatches = [...expectedSourceDerived.locations]
		.filter(
			([deviceId, value]) =>
				canonicalValue(value) !==
				canonicalValue(targetSourceDerived.locations.get(deviceId) ?? []),
		)
		.map(([deviceId]) => deviceId)
	const apiKeyValueMismatches = preservedApiKeyMismatches(
		snapshot,
		targetApiKeys,
	)
	const [mqttRows, ttnRows, mqttInvalid, ttnInvalid] = await Promise.all([
		dependencies.mqtt?.configurationRows() ?? [],
		dependencies.ttn?.configurationRows() ?? [],
		dependencies.mqtt?.invalidCount() ?? 0,
		dependencies.ttn?.invalidCount() ?? 0,
	])
	const mqttIds = new Set(mqttRows.map((row) => row.deviceId))
	const ttnIds = new Set(ttnRows.map((row) => row.deviceId))
	const expectedIntegrations = expectedIntegrationConfigurations(
		snapshot,
		new Set(archivedDeviceIds),
		config.to,
	)
	const mqttValueMismatches = configurationMismatches(
		expectedIntegrations.mqtt,
		mqttRows,
	)
	const ttnValueMismatches = configurationMismatches(
		expectedIntegrations.ttn,
		ttnRows,
	)
	const mqttUnknownDevices = [...mqttIds].filter((id) => !appDeviceIds.has(id))
	const ttnUnknownDevices = [...ttnIds].filter((id) => !appDeviceIds.has(id))
	const mqttUnexpectedConfigs = [...mqttIds].filter(
		(id) => !expectedIntegrations.mqtt.has(id),
	)
	const ttnUnexpectedConfigs = [...ttnIds].filter(
		(id) => !expectedIntegrations.ttn.has(id),
	)
	const mqttMissingDevices = expectedEntities.mqtt.filter(
		(id) => !mqttIds.has(id),
	)
	const ttnMissingDevices = expectedEntities.ttn.filter((id) => !ttnIds.has(id))
	const ownerMismatches = expectedEntities.device.filter(
		(deviceId) =>
			targetOwners.get(deviceId) !==
			(snapshot.ownerByDeviceId.get(deviceId) ?? ORPHAN_USER_ID),
	)
	const sensorDeviceMismatches = expectedEntities.sensor.filter(
		(sensorId) =>
			targetSensorDevices.get(sensorId) !==
			snapshot.sensorToDeviceId.get(sensorId),
	)
	const aggregateValidation =
		await dependencies.app.continuousAggregateValidation(
			config.runId,
			config.from,
			config.to,
		)
	const issues = [
		...Object.entries(validation.invariants)
			.filter(([, count]) => count !== 0)
			.map(([name, count]) => ({ name, count })),
		...(mqttInvalid ? [{ name: 'invalidMqttRows', count: mqttInvalid }] : []),
		...(ttnInvalid ? [{ name: 'invalidTtnRows', count: ttnInvalid }] : []),
		...(mqttUnknownDevices.length
			? [{ name: 'mqttUnknownDevices', count: mqttUnknownDevices.length }]
			: []),
		...(ttnUnknownDevices.length
			? [{ name: 'ttnUnknownDevices', count: ttnUnknownDevices.length }]
			: []),
		...(mqttUnexpectedConfigs.length
			? [
					{
						name: 'mqttUnexpectedConfigurations',
						count: mqttUnexpectedConfigs.length,
					},
				]
			: []),
		...(ttnUnexpectedConfigs.length
			? [
					{
						name: 'ttnUnexpectedConfigurations',
						count: ttnUnexpectedConfigs.length,
					},
				]
			: []),
		...(mqttMissingDevices.length
			? [{ name: 'mqttMissingDevices', count: mqttMissingDevices.length }]
			: []),
		...(ttnMissingDevices.length
			? [{ name: 'ttnMissingDevices', count: ttnMissingDevices.length }]
			: []),
		...(mqttValueMismatches.length
			? [
					{
						name: 'mqttConfigurationMismatch',
						count: mqttValueMismatches.length,
					},
				]
			: []),
		...(ttnValueMismatches.length
			? [
					{
						name: 'ttnConfigurationMismatch',
						count: ttnValueMismatches.length,
					},
				]
			: []),
		...(ownerMismatches.length
			? [{ name: 'deviceOwnerMismatch', count: ownerMismatches.length }]
			: []),
		...(sensorDeviceMismatches.length
			? [{ name: 'sensorDeviceMismatch', count: sensorDeviceMismatches.length }]
			: []),
		...(userValueMismatches.length
			? [{ name: 'userValueMismatch', count: userValueMismatches.length }]
			: []),
		...(deviceValueMismatches.length
			? [{ name: 'deviceValueMismatch', count: deviceValueMismatches.length }]
			: []),
		...(sensorValueMismatches.length
			? [{ name: 'sensorValueMismatch', count: sensorValueMismatches.length }]
			: []),
		...(locationValueMismatches.length
			? [
					{
						name: 'locationValueMismatch',
						count: locationValueMismatches.length,
					},
				]
			: []),
		...(apiKeyValueMismatches.length
			? [
					{
						name: 'preservedApiKeyMismatch',
						count: apiKeyValueMismatches.length,
					},
				]
			: []),
		...(measurementManifest.mismatchCount
			? [
					{
						name: 'measurementManifestMismatch',
						count: measurementManifest.mismatchCount,
					},
				]
			: []),
		...(mediaValidation.mismatchCount
			? [
					{
						name: 'mediaManifestMismatch',
						count: mediaValidation.mismatchCount,
					},
				]
			: []),
		...(aggregateValidation?.mismatchCount
			? [
					{
						name: 'continuousAggregateMismatch',
						count: aggregateValidation.mismatchCount,
					},
				]
			: []),
		...(aggregateValidation && aggregateValidation.views.length !== CAGGS.length
			? [
					{
						name: 'continuousAggregateViewsMissing',
						count: CAGGS.length - aggregateValidation.views.length,
					},
				]
			: []),
	]
	if (!validation.tosAcceptBy || validation.tosAcceptBy <= config.to) {
		issues.push({ name: 'tosGracePeriodInvalid', count: 1 })
	}
	dependencies.report.validation = {
		...validation,
		mqttRows: mqttIds.size,
		ttnRows: ttnIds.size,
		measurementManifest,
		mediaValidation,
		aggregateValidation,
		ownerMismatches: ownerMismatches.slice(0, 100),
		sensorDeviceMismatches: sensorDeviceMismatches.slice(0, 100),
		userValueMismatches: userValueMismatches.slice(0, 100),
		deviceValueMismatches: deviceValueMismatches.slice(0, 100),
		sensorValueMismatches: sensorValueMismatches.slice(0, 100),
		locationValueMismatches: locationValueMismatches.slice(0, 100),
		apiKeyValueMismatches: apiKeyValueMismatches.slice(0, 100),
		mqttValueMismatches: mqttValueMismatches.slice(0, 100),
		ttnValueMismatches: ttnValueMismatches.slice(0, 100),
		mqttUnexpectedConfigs: mqttUnexpectedConfigs.slice(0, 100),
		ttnUnexpectedConfigs: ttnUnexpectedConfigs.slice(0, 100),
		issues,
	}
	if (issues.length > 0) {
		throw new Error(
			`Migration validation failed: ${issues.map((issue) => issue.name).join(', ')}`,
		)
	}
	result.sourceSeen = Object.keys(validation.invariants).length
	result.written = result.sourceSeen
	if (config.manageJobs) {
		await dependencies.app.restoreBackgroundJobs(config.runId)
	}
	return result
}
