import { createHash } from 'node:crypto'
import { ORPHAN_USER_ID } from './app-target'
import { canonicalValue } from './canonical'
import { subtractUtcMonths } from './config'
import { type MigrationDependencies } from './context'
import { validateApiKeyPolicy } from './device-credentials'
import {
	legacyId,
	transformMqttIntegration,
	transformTtnIntegration,
	transformUser,
} from './domain/transforms'
import { type MigrationConfig, type SourceSnapshot } from './types'

export const CAGGS = [
	'measurement_10min',
	'measurement_1hour',
	'measurement_1day',
	'measurement_1month',
	'measurement_1year',
]

const FATAL_SOURCE_ANOMALIES = new Set([
	'device_missing_id',
	'invalid_device_location',
	'invalid_sensor_shape',
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

/**
 * Produces a deterministic digest of the users and boxes that define the snapshot.
 * Resume uses it to reject a source that changed after the original run started.
 */
export function snapshotSha256(snapshot: SourceSnapshot) {
	const hash = createHash('sha256')
	for (const [collection, documents] of [
		['users', snapshot.users],
		['boxes', snapshot.boxes],
	] as const) {
		for (const document of [...documents].sort((left, right) =>
			(legacyId(left._id) ?? '').localeCompare(legacyId(right._id) ?? ''),
		)) {
			hash.update(`${collection}:${canonicalValue(document)}\n`)
		}
	}
	return hash.digest('hex')
}

/** Returns only sensor IDs whose owning device survived source normalization. */
export function validSensorIds(snapshot: SourceSnapshot) {
	return new Set(
		[...snapshot.sensorToDeviceId]
			.filter(([, deviceId]) => deviceId !== null)
			.map(([sensorId]) => sensorId),
	)
}

/** Copies source anomalies into the migration audit schema for later review. */
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

/** Selects source anomalies that make ownership or identity migration unsafe. */
export function fatalSourceAnomalies(snapshot: SourceSnapshot) {
	return snapshot.anomalies.filter((anomaly) =>
		FATAL_SOURCE_ANOMALIES.has(anomaly.code),
	)
}

/**
 * Checks the minimum MongoDB protocol contract and requires replica-set semantics
 * only when preflight reads directly from production.
 */
export function validateMongoSourceCompatibility(
	config: MigrationConfig,
	sourceFingerprint: Record<string, unknown>,
) {
	if (
		config.sourceKind === 'production-readonly' &&
		sourceFingerprint.replicaSet == null
	) {
		throw new Error('Production MongoDB source must be a replica set')
	}
	if (
		typeof sourceFingerprint.maxWireVersion !== 'number' ||
		sourceFingerprint.maxWireVersion < 6
	) {
		throw new Error('MongoDB source must support wire version 6 or newer')
	}
}

/**
 * Derives the exact source-ID sets each target is allowed to contain. These sets
 * scope resume checks and final validation to this migration run.
 */
export function expectedEntityIds(
	snapshot: SourceSnapshot,
	includeMedia = true,
) {
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
		if (includeMedia && typeof box.image === 'string' && box.image.trim()) {
			media.push(deviceId)
		}
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

/** Persists the expected ID sets before copying data so later checks are run-scoped. */
export async function recordExpectedEntities(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const entities = expectedEntityIds(snapshot, !config.skipImages)
	for (const [entity, ids] of Object.entries(entities)) {
		await dependencies.app.recordEntityIds(config.runId, entity, ids)
	}
	return entities
}

/**
 * Verifies the complete source/target contract and emptiness or resumability before
 * any business rows are copied. It also populates the report's preflight evidence.
 */
export async function preflight(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
	sourceFingerprint: Record<string, unknown>,
) {
	const { app, mqtt, ttn, images, report } = dependencies
	if (!mqtt || !ttn || (!config.skipImages && !images)) {
		throw new Error(
			'App and integration targets are required; configure media or set MIGRATION_SKIP_IMAGES=true',
		)
	}
	const [sourceCounts, appInfo, mqttInfo, ttnInfo, imageInfo] =
		await Promise.all([
			dependencies.source.counts(config.from, config.to),
			app.inspect(config.to),
			mqtt.inspect(),
			ttn.inspect(),
			config.skipImages
				? Promise.resolve({ status: 'skipped' as const })
				: images!.inspect(),
		])
	if (config.skipImages) {
		report.warn({
			severity: 'high',
			code: 'device_images_intentionally_omitted',
			message:
				'Device image references and objects are not migrated because MIGRATION_SKIP_IMAGES=true',
		})
	}
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
	validateMongoSourceCompatibility(config, sourceFingerprint)
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
			transformed.value.email === 'orphaned@opensensemap.org'
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
			.some((aggregate) => !aggregate.materializedOnly)
	) {
		throw new Error(
			'All migration continuous aggregates must be materialized-only',
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
	if (config.resume) {
		const expected = expectedEntityIds(snapshot, !config.skipImages)
		await app.assertResumeTarget(config.runId, config.from, config.to)
		await mqtt.assertResumable(new Set(expected.mqtt))
		await ttn.assertResumable(new Set(expected.ttn))
	} else {
		await app.assertTargetEmpty()
		await mqtt.assertEmpty()
		await ttn.assertEmpty()
	}

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
	const fatalAnomalies = fatalSourceAnomalies(snapshot)
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
