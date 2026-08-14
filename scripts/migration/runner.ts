import { createHash, randomBytes } from 'node:crypto'
import { type AppTarget, ORPHAN_USER_ID } from './app-target'
import { redactedConfigHash, subtractUtcMonths } from './config'
import {
	legacyId,
	transformDevice,
	transformMeasurement,
	transformMqttIntegration,
	transformTtnIntegration,
	transformUser,
} from './domain/transforms'
import { type IntegrationTarget } from './integration-target'
import { type DeviceImageStore } from './object-store'
import { type MigrationReport } from './report'
import {
	type Checkpoint,
	type CheckpointCounters,
	type ApiKeyMode,
	type LegacyBox,
	type MigrationConfig,
	type MigratedMeasurement,
	type Phase,
	type PhaseResult,
	type SafeLogger,
	type SourceSnapshot,
	PHASES,
} from './types'
import { type MeasurementCursor, type MongoSource } from './source'

const CAGGS = [
	'measurement_10min',
	'measurement_1hour',
	'measurement_1day',
	'measurement_1month',
	'measurement_1year',
]

const MUTATING_PHASES = new Set<Phase>([
	'accounts',
	'devices',
	'measurements',
	'integrations',
	'media',
	'finalize',
	'validate',
])

const PHASE_PREREQUISITES: Partial<Record<Phase, Phase[]>> = {
	devices: ['accounts'],
	measurements: ['devices'],
	integrations: ['devices'],
	media: ['devices'],
	finalize: ['devices', 'measurements', 'integrations', 'media'],
	validate: [
		'accounts',
		'devices',
		'measurements',
		'integrations',
		'media',
		'finalize',
	],
}

const FATAL_SOURCE_ANOMALIES = new Set([
	'device_missing_id',
	'invalid_device_location',
	'invalid_sensor_shape',
	'sensor_missing_id',
	'duplicate_user_natural_key',
	'multiple_device_owners_orphaned',
	'duplicate_sensor_id',
])

const REQUIRED_APP_COLUMNS = [
	'user.id',
	'user.name',
	'user.email',
	'user.unconfirmed_email',
	'user.theme_preference',
	'user.role',
	'user.language',
	'user.email_is_confirmed',
	'user.newsletter_opt_in',
	'user.created_at',
	'user.updated_at',
	'user.accepted_tos_version_id',
	'user.accepted_tos_at',
	'password.user_id',
	'password.hash',
	'profile.id',
	'profile.display_name',
	'profile.public',
	'profile.user_id',
	'location.id',
	'location.location',
	'device.id',
	'device.name',
	'device.image',
	'device.website',
	'device.description',
	'device.tags',
	'device.link',
	'device.use_auth',
	'device.apiKey',
	'device.exposure',
	'device.status',
	'device.model',
	'device.public',
	'device.created_at',
	'device.updated_at',
	'device.user_id',
	'device.archived_at',
	'device.orphaned_at',
	'device.latitude',
	'device.longitude',
	'device.device_schema_version_id',
	'device_to_location.device_id',
	'device_to_location.location_id',
	'device_to_location.time',
	'sensor.id',
	'sensor.title',
	'sensor.unit',
	'sensor.sensor_type',
	'sensor.icon',
	'sensor.status',
	'sensor.created_at',
	'sensor.updated_at',
	'sensor.device_id',
	'sensor.lastMeasurement',
	'sensor.order',
	'measurement.sensor_id',
	'measurement.time',
	'measurement.value',
	'measurement.location_id',
	'integration.slug',
	'integration.service_url',
	'integration.service_key',
	'tos_version.accept_by',
	'tos_user_state.user_id',
	'tos_user_state.accepted_at',
]

const APP_ENUMS: Record<string, string[]> = {
	exposure: ['indoor', 'outdoor', 'mobile', 'unknown'],
	status: ['active', 'inactive', 'old'],
	model: [
		'homeV2Lora',
		'homeV2Ethernet',
		'homeV2Wifi',
		'homeEthernet',
		'homeWifi',
		'homeEthernetFeinstaub',
		'homeWifiFeinstaub',
		'luftdaten_sds011',
		'luftdaten_sds011_dht11',
		'luftdaten_sds011_dht22',
		'luftdaten_sds011_bmp180',
		'luftdaten_sds011_bme280',
		'hackair_home_v2',
		'senseBox:Edu',
		'luftdaten.info',
		'custom',
	],
}

export type MigrationDependencies = {
	source: MongoSource
	app: AppTarget
	mqtt?: IntegrationTarget
	ttn?: IntegrationTarget
	images?: DeviceImageStore
	logger: SafeLogger
	report: MigrationReport
	signal?: AbortSignal
}

function throwIfAborted(dependencies: MigrationDependencies) {
	dependencies.signal?.throwIfAborted()
}

function legacyAccessToken(box: LegacyBox) {
	return typeof box.access_token === 'string' && box.access_token.length > 0
		? box.access_token
		: null
}

function selectDeviceApiKey(
	box: LegacyBox,
	mode: ApiKeyMode,
	existingKey: string | null,
) {
	if (existingKey !== null) {
		if (!existingKey) {
			throw new Error('Existing target device API key is empty')
		}
		const legacyToken = legacyAccessToken(box)
		if (mode === 'preserve' && legacyToken && existingKey !== legacyToken) {
			throw new Error(
				'Existing target API key differs from the legacy device token',
			)
		}
		return existingKey
	}

	if (mode === 'preserve') {
		const token = legacyAccessToken(box)
		if (token) return token
		if (box.useAuth === true) {
			throw new Error('Authenticated legacy device has no usable access token')
		}
	}

	return randomBytes(32).toString('base64url')
}

function authenticatedCredentialInventory(snapshot: SourceSnapshot) {
	const authenticatedDeviceIds: string[] = []
	const missingDeviceIds: string[] = []
	const devicesByToken = new Map<string, string[]>()

	for (const deviceId of [...snapshot.migratableDeviceIds].sort()) {
		const box = snapshot.boxById.get(deviceId)!
		const token = legacyAccessToken(box)
		if (box.useAuth === true) authenticatedDeviceIds.push(deviceId)
		if (!token) {
			if (box.useAuth === true) missingDeviceIds.push(deviceId)
			continue
		}
		const owners = devicesByToken.get(token) ?? []
		owners.push(deviceId)
		devicesByToken.set(token, owners)
	}

	return {
		authenticatedDeviceIds,
		missingDeviceIds,
		duplicateDeviceGroups: [...devicesByToken.values()].filter(
			(deviceIds) => deviceIds.length > 1,
		),
	}
}

async function validateApiKeyPolicy(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const inventory = authenticatedCredentialInventory(snapshot)
	Object.assign(dependencies.report.preflight, {
		apiKeyPolicy: {
			mode: config.apiKeyMode,
			authenticatedDevices: inventory.authenticatedDeviceIds.length,
		},
	})

	if (config.apiKeyMode === 'rotate') {
		if (inventory.authenticatedDeviceIds.length > 0) {
			dependencies.report.warn({
				severity: 'high',
				code: 'authenticated_device_api_keys_will_be_rotated',
				message:
					'Authenticated devices cannot write to vNext until they are provisioned with their new API keys',
				count: inventory.authenticatedDeviceIds.length,
				deviceIds: inventory.authenticatedDeviceIds.slice(0, 100),
			})
		}
		return
	}

	for (const deviceId of inventory.missingDeviceIds) {
		await dependencies.app.reject(config.runId, {
			phase: 'preflight',
			sourceCollection: 'boxes',
			sourceId: deviceId,
			code: 'authenticated_device_missing_access_token',
		})
	}
	for (const deviceIds of inventory.duplicateDeviceGroups) {
		for (const deviceId of deviceIds) {
			await dependencies.app.reject(config.runId, {
				phase: 'preflight',
				sourceCollection: 'boxes',
				sourceId: deviceId,
				code: 'duplicate_legacy_device_access_token',
				details: { deviceIds },
			})
		}
	}
	if (
		inventory.missingDeviceIds.length > 0 ||
		inventory.duplicateDeviceGroups.length > 0
	) {
		dependencies.report.warn({
			severity: 'high',
			code: 'legacy_device_access_tokens_cannot_be_preserved',
			missingTokenDeviceIds: inventory.missingDeviceIds.slice(0, 100),
			duplicateTokenDeviceGroups: inventory.duplicateDeviceGroups
				.slice(0, 100)
				.map((deviceIds) => deviceIds.slice(0, 100)),
		})
		throw new Error(
			'Legacy device access tokens cannot be preserved safely; resolve the reported device IDs or explicitly select rotation mode',
		)
	}
}

function canonicalSourceValue(value: unknown): string {
	if (value instanceof Date) return JSON.stringify(value.toISOString())
	const id = legacyId(value)
	if (id && value && typeof value === 'object' && 'toHexString' in value) {
		return JSON.stringify(id)
	}
	if (Array.isArray(value)) {
		return `[${value.map(canonicalSourceValue).join(',')}]`
	}
	if (value && typeof value === 'object') {
		return `{${Object.entries(value)
			.filter(([, item]) => item !== undefined)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(
				([key, item]) => `${JSON.stringify(key)}:${canonicalSourceValue(item)}`,
			)
			.join(',')}}`
	}
	return JSON.stringify(value)
}

function snapshotSha256(snapshot: SourceSnapshot) {
	const hash = createHash('sha256')
	for (const [collection, documents] of [
		['users', snapshot.users],
		['boxes', snapshot.boxes],
	] as const) {
		for (const document of [...documents].sort((left, right) =>
			(legacyId(left._id) ?? '').localeCompare(legacyId(right._id) ?? ''),
		)) {
			hash.update(`${collection}:${canonicalSourceValue(document)}\n`)
		}
	}
	return hash.digest('hex')
}

function freshCheckpoint(phase: Phase, partitionKey = ''): Checkpoint {
	return {
		phase,
		partitionKey,
		status: 'pending',
		cursor: null,
		sourceSeen: 0,
		written: 0,
		skipped: 0,
		rejected: 0,
	}
}

function resultFromCheckpoint(checkpoint: Checkpoint): PhaseResult {
	return {
		phase: checkpoint.phase,
		sourceSeen: checkpoint.sourceSeen,
		written: checkpoint.written,
		skipped: checkpoint.skipped,
		rejected: checkpoint.rejected,
	}
}

function addCounters(target: CheckpointCounters, source: CheckpointCounters) {
	target.sourceSeen += source.sourceSeen
	target.written += source.written
	target.skipped += source.skipped
	target.rejected += source.rejected
}

function validSensorIds(snapshot: SourceSnapshot) {
	return new Set(
		[...snapshot.sensorToDeviceId]
			.filter(([, deviceId]) => deviceId !== null)
			.map(([sensorId]) => sensorId),
	)
}

async function rejectAnomalies(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	for (const anomaly of snapshot.anomalies) {
		await dependencies.app.reject(config.runId, {
			phase: 'preflight',
			sourceCollection: anomaly.collection,
			sourceId: anomaly.sourceId,
			code: anomaly.code,
			details: anomaly.details,
		})
	}
}

async function preflight(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	sourceFingerprint: Record<string, unknown>,
	targetScopeEstablished: boolean,
) {
	const { app, mqtt, ttn, images, report } = dependencies
	if (!mqtt || !ttn || !images) {
		throw new Error('App, MQTT, TTN, and media targets must all be configured')
	}
	const [sourceCounts, appInfo, mqttInfo, ttnInfo, imageInfo] =
		await Promise.all([
			dependencies.source.counts(config.from, config.to),
			app.inspect(config.to),
			mqtt.inspect(),
			ttn.inspect(),
			images.inspect(),
		])
	const fullAggregateHistoryFrom = subtractUtcMonths(config.to, 24)
	Object.assign(report.preflight, {
		source: {
			kind: config.sourceKind,
			backupId: config.backupId ?? null,
		},
		measurementWindow: {
			from: config.from,
			to: config.to,
			archiveBefore: config.archiveBefore,
			coversArchiveRetentionWindow: config.from <= config.archiveBefore,
			coversLongestAggregateRetentionWindow:
				config.from <= fullAggregateHistoryFrom,
		},
	})
	if (config.from > fullAggregateHistoryFrom) {
		report.warn({
			code: 'measurement_history_shorter_than_longest_aggregate_retention',
			message:
				'The migration includes enough history for 12-month device archival, but older continuous-aggregate periods will remain empty',
			migrationFrom: config.from,
			fullAggregateHistoryFrom,
		})
	}

	const extensionNames = new Set(appInfo.extensions.map((item) => item.extname))
	const requiredExtensions = ['timescaledb', 'timescaledb_toolkit', 'postgis']
	if (config.manageJobs) requiredExtensions.push('pg_cron')
	const missingExtensions = requiredExtensions.filter(
		(name) => !extensionNames.has(name),
	)
	if (sourceFingerprint.replicaSet == null) {
		throw new Error('MongoDB source must be a replica set')
	}
	if (
		typeof sourceFingerprint.maxWireVersion !== 'number' ||
		sourceFingerprint.maxWireVersion < 6
	) {
		throw new Error('MongoDB source must support wire version 6 or newer')
	}
	if (sourceFingerprint.schemaVersion !== 11) {
		throw new Error(
			`Legacy MongoDB schema version must be 11, got ${String(sourceFingerprint.schemaVersion)}`,
		)
	}
	const sourceCollections = new Set(
		Array.isArray(sourceFingerprint.collections)
			? sourceFingerprint.collections.map((item) =>
					item && typeof item === 'object' && 'name' in item
						? String(item.name)
						: '',
				)
			: [],
	)
	for (const collection of [
		'users',
		'boxes',
		'measurements',
		'schemaVersion',
	]) {
		if (!sourceCollections.has(collection)) {
			throw new Error(`MongoDB source collection is missing: ${collection}`)
		}
	}
	await validateApiKeyPolicy(config, dependencies, snapshot)
	for (const user of snapshot.users) {
		const transformed = transformUser(user)
		if (
			!transformed.ok ||
			!snapshot.retainedUserIds.has(transformed.value.id)
		) {
			continue
		}
		if (
			transformed.value.id === ORPHAN_USER_ID ||
			transformed.value.name === 'Orphaned Devices' ||
			transformed.value.email === 'orphaned@opensensemap.org' ||
			transformed.value.unconfirmedEmail === 'orphaned@opensensemap.org'
		) {
			throw new Error(
				'Legacy user collides with the reserved orphan-user identity',
			)
		}
	}
	if (appInfo.version.major !== 18) {
		throw new Error(
			`Target PostgreSQL major must be 18, got ${appInfo.version.major}`,
		)
	}
	if (
		!appInfo.contract.userTable ||
		!appInfo.contract.deviceTable ||
		!appInfo.contract.measurementTable ||
		!appInfo.contract.integrationTable
	) {
		throw new Error('Target App database schema is incomplete')
	}
	const missingColumns = REQUIRED_APP_COLUMNS.filter(
		(column) => !appInfo.columns.includes(column),
	)
	if (missingColumns.length > 0 || !appInfo.contract.hypertable) {
		throw new Error(
			`Target App database contract is incomplete${
				missingColumns.length ? `: ${missingColumns.join(', ')}` : ''
			}`,
		)
	}
	for (const [name, expected] of Object.entries(APP_ENUMS)) {
		if ((appInfo.enums[name] ?? []).join(',') !== expected.join(',')) {
			throw new Error(`Target App enum contract differs for ${name}`)
		}
	}
	if (missingExtensions.length > 0) {
		throw new Error(
			`Target App database is missing: ${missingExtensions.join(', ')}`,
		)
	}
	if (!appInfo.contract.percentileAgg) {
		throw new Error('Timescale Toolkit percentile_agg function is unavailable')
	}
	if (CAGGS.some((view) => !appInfo.continuousAggregates.includes(view))) {
		throw new Error(
			'One or more required Timescale continuous aggregates are missing',
		)
	}
	if (
		appInfo.continuousAggregateDetails
			.filter((aggregate) => CAGGS.includes(aggregate.viewName))
			.some((aggregate) => !aggregate.finalized || !aggregate.materializedOnly)
	) {
		throw new Error(
			'All migration continuous aggregates must be finalized and materialized-only',
		)
	}
	if (!appInfo.currentTos || appInfo.currentTos.acceptBy <= config.to) {
		throw new Error(
			'Target ToS is missing or its accept-by date is not after the migration cutoff',
		)
	}
	if (
		appInfo.integrations.length !== 2 ||
		appInfo.integrations.some((integration) => !integration.configured)
	) {
		throw new Error(
			'Target App integration registry must configure mqtt and ttn',
		)
	}
	if (!mqttInfo?.tableExists || !ttnInfo?.tableExists) {
		throw new Error('MQTT or TTN target schema is incomplete')
	}
	if (
		mqttInfo.enumValues.join(',') !== 'json,csv' ||
		ttnInfo.enumValues.join(',') !==
			'json,debug,sensebox/home,lora-serialization,cayenne-lpp' ||
		!mqttInfo.uniqueDeviceId ||
		!ttnInfo.uniqueDeviceId
	) {
		throw new Error('MQTT or TTN target enum/uniqueness contract is incomplete')
	}
	const requiredMqttColumns = [
		'id',
		'device_id',
		'enabled',
		'url',
		'topic',
		'message_format',
		'decode_options',
		'connection_options',
		'created_at',
		'updated_at',
	]
	const requiredTtnColumns = [
		'id',
		'device_id',
		'enabled',
		'dev_id',
		'app_id',
		'port',
		'profile',
		'decode_options',
		'created_at',
		'updated_at',
	]
	if (
		requiredMqttColumns.some((column) => !mqttInfo.columns.includes(column)) ||
		requiredTtnColumns.some((column) => !ttnInfo.columns.includes(column))
	) {
		throw new Error('MQTT or TTN target column contract is incomplete')
	}
	const expectedTargets = expectedEntityIds(snapshot)
	await app.assertTargetCompatible(config.runId, targetScopeEstablished)
	await mqtt.assertCompatible(expectedTargets.mqtt, targetScopeEstablished)
	await ttn.assertCompatible(expectedTargets.ttn, targetScopeEstablished)

	Object.assign(report.preflight, {
		sourceFingerprint,
		sourceCounts,
		migratableUsers: snapshot.retainedUserIds.size,
		migratableDevices: snapshot.migratableDeviceIds.size,
		migratableSensors: validSensorIds(snapshot).size,
		anomalies: snapshot.anomalies,
		app: {
			version: appInfo.version.version,
			extensions: appInfo.extensions,
			continuousAggregates: appInfo.continuousAggregates,
			continuousAggregateDetails: appInfo.continuousAggregateDetails,
			tosAcceptBy: appInfo.currentTos.acceptBy,
			integrations: appInfo.integrations,
		},
		mqtt: mqttInfo,
		ttn: ttnInfo,
		media: imageInfo,
	})
	await rejectAnomalies(config, dependencies, snapshot)
	const fatalAnomalies = snapshot.anomalies.filter((anomaly) =>
		FATAL_SOURCE_ANOMALIES.has(anomaly.code),
	)
	if (fatalAnomalies.length > 0) {
		throw new Error(
			`Source preflight found ${fatalAnomalies.length} fatal device, ownership, or sensor conflict(s)`,
		)
	}
	const unexpectedMeasurements =
		await dependencies.source.unexpectedMeasurementSensorCounts(
			validSensorIds(snapshot),
			config.from,
			config.to,
		)
	if (unexpectedMeasurements.length > 0) {
		for (const unexpected of unexpectedMeasurements) {
			await app.reject(config.runId, {
				phase: 'preflight',
				sourceCollection: 'measurements',
				sourceId: unexpected.sensorId,
				code: 'measurement_sensor_missing_from_migratable_devices',
				details: { count: unexpected.count },
			})
		}
		Object.assign(report.preflight, {
			unexpectedMeasurementSensors: {
				count: unexpectedMeasurements.length,
				measurements: unexpectedMeasurements.reduce(
					(total, item) => total + item.count,
					0,
				),
				sensorIds: unexpectedMeasurements
					.slice(0, 100)
					.map((item) => item.sensorId),
			},
		})
		throw new Error(
			`Source preflight found measurements for ${unexpectedMeasurements.length} sensor(s) that cannot be migrated`,
		)
	}
}

function expectedEntityIds(snapshot: SourceSnapshot) {
	const mqtt: string[] = []
	const ttn: string[] = []
	const media: string[] = []
	for (const deviceId of snapshot.migratableDeviceIds) {
		const box = snapshot.boxById.get(deviceId)!
		const mqttResult = transformMqttIntegration(
			deviceId,
			box.integrations?.mqtt ?? box.mqtt,
		)
		const ttnResult = transformTtnIntegration(deviceId, box.integrations?.ttn)
		if (mqttResult.ok && mqttResult.value) mqtt.push(deviceId)
		if (ttnResult.ok && ttnResult.value) ttn.push(deviceId)
		if (typeof box.image === 'string' && box.image.trim()) media.push(deviceId)
	}
	return {
		user: [...snapshot.retainedUserIds].sort(),
		device: [...snapshot.migratableDeviceIds].sort(),
		sensor: [...validSensorIds(snapshot)].sort(),
		mqtt: mqtt.sort(),
		ttn: ttn.sort(),
		media: media.sort(),
	}
}

async function recordExpectedEntities(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const entities = expectedEntityIds(snapshot)
	for (const [entity, ids] of Object.entries(entities)) {
		await dependencies.app.recordEntityIds(config.runId, entity, ids)
	}
	return entities
}

async function assertPrerequisites(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	phase: Phase,
) {
	if (config.dryRun) return
	for (const prerequisite of PHASE_PREREQUISITES[phase] ?? []) {
		const checkpoint = await dependencies.app.getCheckpoint(
			config.runId,
			prerequisite,
		)
		if (checkpoint.status !== 'completed') {
			throw new Error(
				`${phase} phase requires completed ${prerequisite} phase for run ${config.runId}`,
			)
		}
	}
}

async function accountsPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const checkpoint = await dependencies.app.getCheckpoint(
		config.runId,
		'accounts',
	)
	if (checkpoint.status === 'completed') return resultFromCheckpoint(checkpoint)
	checkpoint.status = 'running'
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	await dependencies.app.ensureOrphanUser()

	const users = snapshot.users
		.map((user) => ({ id: legacyId(user._id), user }))
		.filter(
			(item): item is { id: string; user: (typeof snapshot.users)[number] } =>
				Boolean(item.id && snapshot.retainedUserIds.has(item.id)),
		)
		.sort((a, b) => a.id.localeCompare(b.id))

	for (const { id, user } of users) {
		throwIfAborted(dependencies)
		checkpoint.sourceSeen++
		const transformed = transformUser(user)
		if (!transformed.ok) {
			checkpoint.rejected++
			await dependencies.app.reject(config.runId, {
				phase: 'accounts',
				sourceCollection: 'users',
				sourceId: id,
				code: transformed.code,
				details: transformed.details,
			})
			continue
		}
		await dependencies.app.upsertUser(transformed.value)
		checkpoint.written++
	}
	checkpoint.status = 'completed'
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	return resultFromCheckpoint(checkpoint)
}

async function devicesPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const checkpoint = await dependencies.app.getCheckpoint(
		config.runId,
		'devices',
	)
	if (checkpoint.status === 'completed') return resultFromCheckpoint(checkpoint)
	checkpoint.status = 'running'
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	await dependencies.app.ensureOrphanUser()
	const sensorIds = validSensorIds(snapshot)
	const deviceIds = [...snapshot.migratableDeviceIds].sort()

	for (const deviceId of deviceIds) {
		throwIfAborted(dependencies)
		checkpoint.sourceSeen++
		const box = snapshot.boxById.get(deviceId)!
		const ownerId = snapshot.ownerByDeviceId.get(deviceId) ?? ORPHAN_USER_ID
		const transformed = transformDevice(box, ownerId, sensorIds)
		if (!transformed.ok) {
			checkpoint.rejected++
			await dependencies.app.reject(config.runId, {
				phase: 'devices',
				sourceCollection: 'boxes',
				sourceId: deviceId,
				code: transformed.code,
				details: transformed.details,
			})
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
		const existingKey = await dependencies.app.apiKeyForDevice(deviceId)
		const apiKey = selectDeviceApiKey(box, config.apiKeyMode, existingKey)
		await dependencies.app.upsertDevice(transformed.value, apiKey, config.to)
		checkpoint.written++
	}
	checkpoint.status = 'completed'
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	return resultFromCheckpoint(checkpoint)
}

async function flushMeasurementBatch(args: {
	config: MigrationConfig
	dependencies: MigrationDependencies
	checkpoint: Checkpoint
	batch: MigratedMeasurement[]
	cursor: MeasurementCursor
}) {
	args.checkpoint.cursor = args.cursor
	await args.dependencies.app.insertMeasurementBatch(
		args.config.runId,
		args.batch,
		args.checkpoint,
	)
	args.batch.length = 0
}

async function measurementsPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const phaseCheckpoint = await dependencies.app.getCheckpoint(
		config.runId,
		'measurements',
	)
	if (phaseCheckpoint.status === 'completed') {
		return resultFromCheckpoint(phaseCheckpoint)
	}
	phaseCheckpoint.status = 'running'
	await dependencies.app.saveCheckpoint(config.runId, phaseCheckpoint)
	const totals: CheckpointCounters = {
		sourceSeen: 0,
		written: 0,
		skipped: 0,
		rejected: 0,
	}
	for (const sensorId of [...validSensorIds(snapshot)].sort()) {
		throwIfAborted(dependencies)
		const checkpoint = await dependencies.app.getCheckpoint(
			config.runId,
			'measurements',
			sensorId,
		)
		if (checkpoint.status === 'completed') {
			addCounters(totals, checkpoint)
			continue
		}
		checkpoint.status = 'running'
		await dependencies.app.saveCheckpoint(config.runId, checkpoint)
		const resume = checkpoint.cursor as MeasurementCursor | null
		const batch: MigratedMeasurement[] = []
		let sinceFlush = 0
		let cursor = resume ?? undefined
		for await (const sourceGroup of dependencies.source.measurementGroupsForSensor(
			sensorId,
			config.from,
			config.to,
			resume ?? undefined,
		)) {
			throwIfAborted(dependencies)
			checkpoint.sourceSeen += sourceGroup.length
			sinceFlush += sourceGroup.length
			let accepted = false
			for (const sourceMeasurement of sourceGroup) {
				const sourceId = legacyId(sourceMeasurement._id)
				const transformed = transformMeasurement(
					sourceMeasurement,
					sensorId,
					config.from,
					config.to,
				)
				if (!transformed.ok) {
					checkpoint.rejected++
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
					checkpoint.skipped++
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
			const finalMeasurement = sourceGroup.at(-1)
			const finalTime = finalMeasurement?.createdAt
			const finalId = finalMeasurement ? legacyId(finalMeasurement._id) : null
			if (finalTime instanceof Date && Number.isFinite(finalTime.getTime())) {
				cursor = {
					createdAt: finalTime.toISOString(),
					...(finalId ? { id: finalId } : {}),
				}
			}

			if (sinceFlush >= config.batchSize && cursor) {
				await flushMeasurementBatch({
					config,
					dependencies,
					checkpoint,
					batch,
					cursor,
				})
				sinceFlush = 0
			}
		}
		if (cursor && (batch.length > 0 || sinceFlush > 0)) {
			await flushMeasurementBatch({
				config,
				dependencies,
				checkpoint,
				batch,
				cursor,
			})
		}
		checkpoint.status = 'completed'
		await dependencies.app.saveCheckpoint(config.runId, checkpoint)
		addCounters(totals, checkpoint)
	}
	Object.assign(phaseCheckpoint, totals, { status: 'completed' as const })
	await dependencies.app.saveCheckpoint(config.runId, phaseCheckpoint)
	return resultFromCheckpoint(phaseCheckpoint)
}

async function integrationsPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	if (!dependencies.mqtt || !dependencies.ttn) {
		throw new Error('Integration targets were not configured')
	}
	const phaseCheckpoint = await dependencies.app.getCheckpoint(
		config.runId,
		'integrations',
	)
	if (phaseCheckpoint.status === 'completed') {
		return resultFromCheckpoint(phaseCheckpoint)
	}
	phaseCheckpoint.status = 'running'
	await dependencies.app.saveCheckpoint(config.runId, phaseCheckpoint)
	const totals: CheckpointCounters = {
		sourceSeen: 0,
		written: 0,
		skipped: 0,
		rejected: 0,
	}
	for (const deviceId of [...snapshot.migratableDeviceIds].sort()) {
		throwIfAborted(dependencies)
		const checkpoint = await dependencies.app.getCheckpoint(
			config.runId,
			'integrations',
			deviceId,
		)
		if (checkpoint.status === 'completed') {
			addCounters(totals, checkpoint)
			continue
		}
		checkpoint.status = 'running'
		checkpoint.sourceSeen = 1
		await dependencies.app.saveCheckpoint(config.runId, checkpoint)
		const box = snapshot.boxById.get(deviceId)!
		const mqtt = transformMqttIntegration(
			deviceId,
			box.integrations?.mqtt ?? box.mqtt,
		)
		const ttn = transformTtnIntegration(deviceId, box.integrations?.ttn)
		for (const [kind, result] of [
			['mqtt', mqtt],
			['ttn', ttn],
		] as const) {
			if (!result.ok) {
				checkpoint.rejected++
				await dependencies.app.reject(config.runId, {
					phase: 'integrations',
					sourceCollection: 'boxes',
					sourceId: deviceId,
					code: `${kind}_${result.code}`,
					details: result.details,
				})
				continue
			}
			if (!result.value) {
				checkpoint.skipped++
				continue
			}
			if (kind === 'mqtt') {
				await dependencies.mqtt.upsertMqtt(result.value, config.to)
			} else {
				await dependencies.ttn.upsertTtn(result.value, config.to)
			}
			checkpoint.written++
		}
		checkpoint.status = 'completed'
		await dependencies.app.saveCheckpoint(config.runId, checkpoint)
		addCounters(totals, checkpoint)
	}
	Object.assign(phaseCheckpoint, totals, { status: 'completed' as const })
	await dependencies.app.saveCheckpoint(config.runId, phaseCheckpoint)
	return resultFromCheckpoint(phaseCheckpoint)
}

async function mediaPhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	if (!dependencies.images || !config.s3) {
		throw new Error('Media source/S3 target was not configured')
	}
	const phaseCheckpoint = await dependencies.app.getCheckpoint(
		config.runId,
		'media',
	)
	if (phaseCheckpoint.status === 'completed') {
		return resultFromCheckpoint(phaseCheckpoint)
	}
	phaseCheckpoint.status = 'running'
	await dependencies.app.saveCheckpoint(config.runId, phaseCheckpoint)
	const totals: CheckpointCounters = {
		sourceSeen: 0,
		written: 0,
		skipped: 0,
		rejected: 0,
	}
	for (const deviceId of [...snapshot.migratableDeviceIds].sort()) {
		throwIfAborted(dependencies)
		const box = snapshot.boxById.get(deviceId)!
		if (typeof box.image !== 'string' || !box.image.trim()) continue
		const checkpoint = await dependencies.app.getCheckpoint(
			config.runId,
			'media',
			deviceId,
		)
		if (checkpoint.status === 'completed') {
			addCounters(totals, checkpoint)
			continue
		}
		checkpoint.status = 'running'
		checkpoint.sourceSeen = 1
		await dependencies.app.saveCheckpoint(config.runId, checkpoint)
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
			if (uploaded.status === 'skipped') checkpoint.skipped++
			else checkpoint.written++
		} catch (error) {
			checkpoint.rejected++
			await dependencies.app.reject(config.runId, {
				phase: 'media',
				sourceCollection: 'boxes',
				sourceId: deviceId,
				code: 'device_image_failed',
				details: {
					message: error instanceof Error ? error.message : String(error),
				},
			})
			checkpoint.status = 'failed'
			await dependencies.app.saveCheckpoint(config.runId, checkpoint, {
				message: error instanceof Error ? error.message : String(error),
			})
			throw error
		}
		checkpoint.status = 'completed'
		await dependencies.app.saveCheckpoint(config.runId, checkpoint)
		addCounters(totals, checkpoint)
	}
	Object.assign(phaseCheckpoint, totals, { status: 'completed' as const })
	await dependencies.app.saveCheckpoint(config.runId, phaseCheckpoint)
	return resultFromCheckpoint(phaseCheckpoint)
}

async function finalizePhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
) {
	const checkpoint = await dependencies.app.getCheckpoint(
		config.runId,
		'finalize',
	)
	if (checkpoint.status === 'completed') return resultFromCheckpoint(checkpoint)
	checkpoint.status = 'running'
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	await dependencies.app.finalize(
		config.runId,
		config.from,
		config.to,
		config.archiveBefore,
	)
	if (config.dryRun) {
		checkpoint.status = 'completed'
		checkpoint.skipped = 1
		await dependencies.app.saveCheckpoint(config.runId, checkpoint)
		return resultFromCheckpoint(checkpoint)
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
	checkpoint.written = 1

	if (config.refreshAggregates) {
		for (const view of CAGGS) {
			const aggregateCheckpoint = await dependencies.app.getCheckpoint(
				config.runId,
				'finalize',
				view,
			)
			if (aggregateCheckpoint.status === 'completed') continue
			aggregateCheckpoint.status = 'running'
			await dependencies.app.saveCheckpoint(config.runId, aggregateCheckpoint)
			await dependencies.app.refreshContinuousAggregate(
				view,
				config.from,
				config.to,
			)
			aggregateCheckpoint.status = 'completed'
			aggregateCheckpoint.written = 1
			await dependencies.app.saveCheckpoint(config.runId, aggregateCheckpoint)
		}
	}
	checkpoint.status = 'completed'
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	return resultFromCheckpoint(checkpoint)
}

type MeasurementDigest = {
	count: number
	sha256: string
	rejected?: number
	duplicates?: number
}

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

async function validateMeasurementManifests(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const sensorIds = [...validSensorIds(snapshot)].sort()
	let expected = 0
	let actual = 0
	const mismatches: string[] = []
	let mismatchCount = 0
	for (const [index, sensorId] of sensorIds.entries()) {
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
		if ((index + 1) % 100 === 0) {
			dependencies.logger.info('Validated measurement partitions', {
				completed: index + 1,
				total: sensorIds.length,
			})
		}
	}
	return {
		expected,
		actual,
		mismatchCount,
		mismatchSensorIds: mismatches,
	}
}

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

function configurationMismatches(
	expected: ReadonlyMap<string, Record<string, unknown>>,
	actualRows: Array<{ deviceId: string; value: Record<string, unknown> }>,
) {
	const actual = new Map(actualRows.map((row) => [row.deviceId, row.value]))
	return [...expected]
		.filter(
			([deviceId, value]) =>
				canonicalSourceValue(value) !==
				canonicalSourceValue(actual.get(deviceId)),
		)
		.map(([deviceId]) => deviceId)
}

function expectedSourceDerivedEntities(snapshot: SourceSnapshot) {
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
			unconfirmedEmail: value.unconfirmedEmail,
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

function entityValueMismatches(
	expected: ReadonlyMap<string, unknown>,
	actualRows: Array<{ id: string; value: Record<string, unknown> }>,
) {
	const actual = new Map(actualRows.map((row) => [row.id, row.value]))
	return [...expected]
		.filter(
			([id, value]) =>
				canonicalSourceValue(value) !== canonicalSourceValue(actual.get(id)),
		)
		.map(([id]) => id)
}

function preservedApiKeyMismatches(
	snapshot: SourceSnapshot,
	actual: ReadonlyMap<string, string | null>,
) {
	return [...snapshot.migratableDeviceIds]
		.filter((deviceId) => {
			const token = legacyAccessToken(snapshot.boxById.get(deviceId)!)
			return token !== null && actual.get(deviceId) !== token
		})
		.sort()
}

async function validatePhase(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	if (config.dryRun) {
		dependencies.report.validation = {
			status: 'skipped_for_dry_run',
			reason: 'No target rows are written during a dry run',
		}
		const checkpoint = freshCheckpoint('validate')
		checkpoint.status = 'completed'
		checkpoint.skipped = 1
		return resultFromCheckpoint(checkpoint)
	}
	const checkpoint = await dependencies.app.getCheckpoint(
		config.runId,
		'validate',
	)
	if (checkpoint.status === 'completed') {
		if (config.manageJobs) {
			await dependencies.app.restoreBackgroundJobs(config.runId)
		}
		return resultFromCheckpoint(checkpoint)
	}
	checkpoint.status = 'running'
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	const expectedEntities = expectedEntityIds(snapshot)
	const measurementManifest = await validateMeasurementManifests(
		config,
		dependencies,
		snapshot,
	)
	const mediaValidation = await validateMedia(
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
				canonicalSourceValue(value) !==
				canonicalSourceValue(targetSourceDerived.locations.get(deviceId) ?? []),
		)
		.map(([deviceId]) => deviceId)
	const apiKeyValueMismatches =
		config.apiKeyMode === 'preserve'
			? preservedApiKeyMismatches(snapshot, targetApiKeys)
			: []
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
	checkpoint.status = 'completed'
	checkpoint.sourceSeen = Object.keys(validation.invariants).length
	checkpoint.written = checkpoint.sourceSeen
	await dependencies.app.saveCheckpoint(config.runId, checkpoint)
	if (config.manageJobs) {
		await dependencies.app.restoreBackgroundJobs(config.runId)
	}
	return resultFromCheckpoint(checkpoint)
}

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
	if (!dependencies.mqtt || !dependencies.ttn || !dependencies.images) {
		throw new Error('App, MQTT, TTN, and media targets must all be configured')
	}
	const snapshot = await dependencies.source.loadSnapshot()
	const sourceFingerprint: Record<string, unknown> = {
		...(await dependencies.source.fingerprint()),
		sourceKind: config.sourceKind,
		backupId: config.backupId ?? null,
		snapshotSha256: snapshotSha256(snapshot),
	}
	await dependencies.app.ensureControlSchema()
	const run = await dependencies.app.beginRun(
		config,
		redactedConfigHash(config),
		sourceFingerprint,
	)
	let targetScopeEstablished = false
	if (!config.dryRun) {
		if (!run?.targetVerified) {
			await dependencies.app.assertTargetCompatible(config.runId, false)
			await dependencies.mqtt.assertCompatible([], false)
			await dependencies.ttn.assertCompatible([], false)
			await dependencies.app.markTargetVerified(config.runId)
		}
		targetScopeEstablished = true
	}
	await recordExpectedEntities(config, dependencies, snapshot)
	await preflight(
		config,
		dependencies,
		snapshot,
		sourceFingerprint,
		targetScopeEstablished,
	)

	if (
		!config.dryRun &&
		config.manageJobs &&
		config.phases.some((phase) => MUTATING_PHASES.has(phase))
	) {
		const jobs = await dependencies.app.pauseBackgroundJobs(config.runId)
		if (!jobs.some((job) => job.name === 'device-archive-inactive')) {
			dependencies.report.warn({
				code: 'ongoing_archive_job_missing',
				message:
					'The current migration journal does not install the inactive-device archive job; deploy it separately after cutover',
			})
		}
	} else if (
		!config.dryRun &&
		!config.manageJobs &&
		config.phases.some((phase) => MUTATING_PHASES.has(phase))
	) {
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
			const checkpoint = freshCheckpoint('preflight')
			checkpoint.status = 'completed'
			checkpoint.sourceSeen = snapshot.users.length + snapshot.boxes.length
			checkpoint.written =
				snapshot.retainedUserIds.size + snapshot.migratableDeviceIds.size
			checkpoint.rejected = snapshot.anomalies.length
			await dependencies.app.saveCheckpoint(config.runId, checkpoint)
			dependencies.report.addPhase(resultFromCheckpoint(checkpoint))
			continue
		}
		await assertPrerequisites(config, dependencies, phase)
		dependencies.logger.info(`Starting ${phase} phase`)
		let result: PhaseResult
		switch (phase) {
			case 'accounts':
				result = await accountsPhase(config, dependencies, snapshot)
				break
			case 'devices':
				result = await devicesPhase(config, dependencies, snapshot)
				break
			case 'measurements':
				result = await measurementsPhase(config, dependencies, snapshot)
				break
			case 'integrations':
				result = await integrationsPhase(config, dependencies, snapshot)
				break
			case 'media':
				result = await mediaPhase(config, dependencies, snapshot)
				break
			case 'finalize':
				result = await finalizePhase(config, dependencies)
				break
			case 'validate':
				result = await validatePhase(config, dependencies, snapshot)
				break
		}
		dependencies.report.addPhase(result)
		dependencies.logger.info(`Completed ${phase} phase`, result)
	}
}

export const migrationInternals = {
	authenticatedCredentialInventory,
	selectDeviceApiKey,
	validateApiKeyPolicy,
	preservedApiKeyMismatches,
	devicesPhase,
	measurementsPhase,
	integrationsPhase,
	mediaPhase,
	validatePhase,
}
