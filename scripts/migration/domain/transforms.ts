import {
	type Coordinates,
	type LegacyBox,
	type LegacyId,
	type LegacyMeasurement,
	type LegacyMqttConfig,
	type LegacySensor,
	type LegacyTtnConfig,
	type LegacyUser,
	type MigratedDevice,
	type MigratedMeasurement,
	type MigratedMqttIntegration,
	type MigratedSensor,
	type MigratedTtnIntegration,
	type MigratedUser,
	type NormalizedLocation,
} from '../types'

const TARGET_MODELS = new Set([
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
])

const TARGET_EXPOSURES = new Set(['indoor', 'outdoor', 'mobile', 'unknown'])
const EARLIEST_PLAUSIBLE_LOCATION_TIME = new Date('2010-01-01T00:00:00.000Z')
const LOCATION_UPDATED_AT_GRACE_MS = 24 * 60 * 60 * 1000
const MAX_LOCATION_TIMESTAMP_ISSUE_SAMPLES = 10
const TARGET_TTN_PROFILES = new Set([
	'json',
	'debug',
	'sensebox/home',
	'lora-serialization',
	'cayenne-lpp',
])

export type TransformResult<T> =
	| { ok: true; value: T; warnings: string[] }
	| { ok: false; code: string; details: Record<string, unknown> }

export function legacyId(value: LegacyId | unknown): string | null {
	if (typeof value === 'string' && value.trim()) return value.trim()
	if (
		value &&
		typeof value === 'object' &&
		'toHexString' in value &&
		typeof value.toHexString === 'function'
	) {
		return value.toHexString()
	}
	return null
}

export function asDate(value: unknown, fallback?: Date): Date | null {
	if (value instanceof Date && Number.isFinite(value.getTime())) return value
	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value)
		if (Number.isFinite(parsed.getTime())) return parsed
	}
	return fallback ?? null
}

function asTrimmedString(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeLongitude(value: number) {
	return value === 180 ? -180 : value
}

export function coordinatesFromLegacy(value: unknown): Coordinates | null {
	if (!value || typeof value !== 'object') return null
	const coordinates = (value as { coordinates?: unknown }).coordinates
	if (
		!Array.isArray(coordinates) ||
		(coordinates.length !== 2 && coordinates.length !== 3) ||
		typeof coordinates[0] !== 'number' ||
		typeof coordinates[1] !== 'number'
	) {
		return null
	}
	const longitude = coordinates[0]
	const latitude = coordinates[1]
	if (
		!Number.isFinite(longitude) ||
		!Number.isFinite(latitude) ||
		longitude < -180 ||
		longitude > 180 ||
		latitude < -90 ||
		latitude > 90
	) {
		return null
	}
	return { longitude: normalizeLongitude(longitude), latitude }
}

function dateFromLegacyId(value: LegacyId | unknown): Date | null {
	if (
		value &&
		typeof value === 'object' &&
		'getTimestamp' in value &&
		typeof value.getTimestamp === 'function'
	) {
		const timestamp = value.getTimestamp()
		if (timestamp instanceof Date && Number.isFinite(timestamp.getTime())) {
			return timestamp
		}
	}
	const id = legacyId(value)
	if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return null
	const seconds = Number.parseInt(id.slice(0, 8), 16)
	const timestamp = new Date(seconds * 1000)
	return Number.isFinite(timestamp.getTime()) ? timestamp : null
}

export function primaryDeviceCoordinates(box: LegacyBox): Coordinates | null {
	const current = coordinatesFromLegacy(box.currentLocation)
	if (current) return current
	if (!Array.isArray(box.locations)) return null
	for (let index = box.locations.length - 1; index >= 0; index--) {
		const coordinates = coordinatesFromLegacy(box.locations[index])
		if (coordinates) return coordinates
	}
	return null
}

type LegacyHeightAboveGround = {
	value: number | null
	malformed: boolean
}

/**
 * Reads the optional third GeoJSON coordinate used by legacy boxes for height
 * above ground. Missing heights remain null; present non-finite/non-numeric values
 * are marked malformed so the migration can retain an audit warning.
 */
function heightAboveGroundFromLegacyLocation(
	value: unknown,
): LegacyHeightAboveGround {
	if (!value || typeof value !== 'object') {
		return { value: null, malformed: false }
	}
	const coordinates = (value as { coordinates?: unknown }).coordinates
	if (!Array.isArray(coordinates) || coordinates.length < 3) {
		return { value: null, malformed: false }
	}
	const height = coordinates[2]
	if (height == null) return { value: null, malformed: false }
	return typeof height === 'number' && Number.isFinite(height)
		? { value: height, malformed: false }
		: { value: null, malformed: true }
}

/**
 * Selects height from the same preferred legacy location as the device position:
 * currentLocation first, otherwise the newest valid historical location.
 */
function primaryDeviceHeightAboveGround(
	box: LegacyBox,
): LegacyHeightAboveGround {
	if (coordinatesFromLegacy(box.currentLocation)) {
		return heightAboveGroundFromLegacyLocation(box.currentLocation)
	}
	if (!Array.isArray(box.locations)) {
		return { value: null, malformed: false }
	}
	for (let index = box.locations.length - 1; index >= 0; index--) {
		const location = box.locations[index]
		if (coordinatesFromLegacy(location)) {
			return heightAboveGroundFromLegacyLocation(location)
		}
	}
	return { value: null, malformed: false }
}

type LocationTimestampIssueReason =
	| 'invalid_explicit_timestamp'
	| 'before_platform_epoch'
	| 'after_device_updated_at'

type LocationTimestampIssue = {
	origin: 'locations' | 'currentLocation'
	index: number | null
	reason: LocationTimestampIssueReason
	action: 'discarded' | 'replaced_with_fallback'
	timestamp: string
	coordinates: Coordinates
}

export type DeviceLocationTimestampAnomaly = {
	count: number
	reasons: Record<LocationTimestampIssueReason, number>
	actions: {
		discarded: number
		replacedWithFallback: number
	}
	minimumAcceptedTimestamp: string
	maximumAcceptedTimestamp: string
	samples: Array<Omit<LocationTimestampIssue, 'coordinates'>>
}

/** Uses stable device metadata fallbacks shared by migration and preflight. */
function deviceDates(box: LegacyBox) {
	const createdAt = asDate(
		box.createdAt,
		dateFromLegacyId(box._id) ?? new Date(0),
	)!
	return { createdAt, updatedAt: asDate(box.updatedAt, createdAt)! }
}

/** Maps legacy exposure values to the target enum before applying location policy. */
function deviceExposure(box: LegacyBox): MigratedDevice['exposure'] {
	const exposure = asTrimmedString(box.exposure)?.toLowerCase() ?? 'unknown'
	return TARGET_EXPOSURES.has(exposure)
		? (exposure as MigratedDevice['exposure'])
		: 'unknown'
}

/** Serializes only the timestamp value needed for a safe anomaly report. */
function reportableTimestamp(value: unknown) {
	if (value instanceof Date && Number.isFinite(value.getTime())) {
		return value.toISOString()
	}
	if (typeof value === 'string' || typeof value === 'number') {
		return String(value)
	}
	return Object.prototype.toString.call(value)
}

/** Returns the report reason for an explicit timestamp outside the accepted range. */
function locationTimestampIssueReason(
	raw: unknown,
	maximumAcceptedTime: Date,
): LocationTimestampIssueReason | null {
	const parsed = asDate(raw)
	if (!parsed) return 'invalid_explicit_timestamp'
	if (parsed < EARLIEST_PLAUSIBLE_LOCATION_TIME) {
		return 'before_platform_epoch'
	}
	return parsed > maximumAcceptedTime ? 'after_device_updated_at' : null
}

/**
 * Scans locations once using the same timestamp rules for both transformation and
 * preflight. When `collectLocations` is false it retains only anomaly metadata, so
 * preflight does not duplicate millions of valid mobile coordinates in memory.
 */
function scanDeviceLocations(box: LegacyBox, collectLocations: boolean) {
	const { createdAt, updatedAt } = deviceDates(box)
	const maximumAcceptedTime = new Date(
		updatedAt.getTime() + LOCATION_UPDATED_AT_GRACE_MS,
	)
	const retainHistory = deviceExposure(box) === 'mobile'
	const candidates: NormalizedLocation[] = []
	let latestCandidate: NormalizedLocation | null = null
	let usableCandidateCount = 0
	const issues: LocationTimestampIssue[] = []
	const addCandidate = (candidate: NormalizedLocation) => {
		usableCandidateCount++
		if (!collectLocations) return
		if (retainHistory) {
			candidates.push(candidate)
		} else if (
			!latestCandidate ||
			candidate.time.getTime() >= latestCandidate.time.getTime()
		) {
			latestCandidate = candidate
		}
	}

	const timestamp = (
		raw: unknown,
		fallback: Date,
		metadata: Pick<LocationTimestampIssue, 'origin' | 'index' | 'coordinates'>,
	) => {
		if (raw == null) return fallback
		const reason = locationTimestampIssueReason(raw, maximumAcceptedTime)
		if (!reason) return asDate(raw)!

		const action =
			metadata.origin === 'currentLocation'
				? 'replaced_with_fallback'
				: 'discarded'
		issues.push({
			...metadata,
			reason,
			action,
			timestamp: reportableTimestamp(raw),
		})
		return action === 'replaced_with_fallback' ? fallback : null
	}

	const rawLocations = Array.isArray(box.locations) ? box.locations : []
	for (const [index, raw] of rawLocations.entries()) {
		const coordinates = coordinatesFromLegacy(raw)
		if (!coordinates) continue
		const time = timestamp(
			raw && typeof raw === 'object'
				? (raw as { timestamp?: unknown }).timestamp
				: null,
			createdAt,
			{ origin: 'locations', index, coordinates },
		)
		if (!time) continue
		addCandidate({ ...coordinates, time })
	}

	const current = coordinatesFromLegacy(box.currentLocation)
	if (current) {
		const time = timestamp(
			box.currentLocation && typeof box.currentLocation === 'object'
				? (box.currentLocation as { timestamp?: unknown }).timestamp
				: null,
			updatedAt,
			{ origin: 'currentLocation', index: null, coordinates: current },
		)!
		addCandidate({ ...current, time })
	}

	// Preserve one usable coordinate when every historical timestamp was corrupt.
	if (usableCandidateCount === 0 && issues.length > 0) {
		const fallbackIssue = issues.at(-1)!
		fallbackIssue.action = 'replaced_with_fallback'
		addCandidate({ ...fallbackIssue.coordinates, time: updatedAt })
	}

	let locations: NormalizedLocation[] = []
	if (collectLocations) {
		if (retainHistory) {
			const byTimestamp = new Map<string, NormalizedLocation>()
			for (const candidate of candidates.sort(
				(a, b) => a.time.getTime() - b.time.getTime(),
			)) {
				byTimestamp.set(candidate.time.toISOString(), candidate)
			}
			locations = [...byTimestamp.values()]
		} else if (latestCandidate) {
			locations = [latestCandidate]
		}
	}

	return {
		locations,
		issues,
		maximumAcceptedTime,
	}
}

/**
 * Retains complete, unsampled history for mobile devices and only the latest
 * normalized location for all other exposure types.
 */
export function deviceLocations(box: LegacyBox) {
	return scanDeviceLocations(box, true).locations
}

/** Compacts per-entry timestamp issues into one bounded preflight anomaly. */
export function deviceLocationTimestampAnomaly(
	box: LegacyBox,
): DeviceLocationTimestampAnomaly | null {
	const { issues, maximumAcceptedTime } = scanDeviceLocations(box, false)
	if (issues.length === 0) return null

	const reasons: DeviceLocationTimestampAnomaly['reasons'] = {
		invalid_explicit_timestamp: 0,
		before_platform_epoch: 0,
		after_device_updated_at: 0,
	}
	for (const issue of issues) reasons[issue.reason]++

	return {
		count: issues.length,
		reasons,
		actions: {
			discarded: issues.filter(({ action }) => action === 'discarded').length,
			replacedWithFallback: issues.filter(
				({ action }) => action === 'replaced_with_fallback',
			).length,
		},
		minimumAcceptedTimestamp: EARLIEST_PLAUSIBLE_LOCATION_TIME.toISOString(),
		maximumAcceptedTimestamp: maximumAcceptedTime.toISOString(),
		samples: issues
			.slice(0, MAX_LOCATION_TIMESTAMP_ISSUE_SAMPLES)
			.map(({ coordinates: _, ...issue }) => issue),
	}
}

function normalizeTags(value: unknown): string[] {
	const candidates = Array.isArray(value) ? value.flat(3) : [value]
	return [
		...new Set(
			candidates
				.filter((item): item is string => typeof item === 'string')
				.map((item) => item.trim())
				.filter(Boolean),
		),
	]
}

export function transformUser(user: LegacyUser): TransformResult<MigratedUser> {
	const id = legacyId(user._id)
	const name = asTrimmedString(user.name)
	const email = asTrimmedString(user.email)?.toLowerCase() ?? null
	const passwordHash = asTrimmedString(user.hashedPassword)
	if (!id || !name || !email || !passwordHash) {
		return {
			ok: false,
			code: 'invalid_user_required_fields',
			details: {
				hasId: Boolean(id),
				hasName: Boolean(name),
				hasEmail: Boolean(email),
				hasPasswordHash: Boolean(passwordHash),
			},
		}
	}
	const createdAt = asDate(
		user.createdAt,
		dateFromLegacyId(user._id) ?? new Date(0),
	)!
	const updatedAt = asDate(user.updatedAt, createdAt)!
	return {
		ok: true,
		warnings: [],
		value: {
			id,
			name,
			email,
			language: asTrimmedString(user.language) ?? 'en_US',
			role: user.role === 'admin' ? 'admin' : 'user',
			emailIsConfirmed: user.emailIsConfirmed === true,
			createdAt,
			updatedAt,
			passwordHash,
			profileId: `profile-${id}`,
			displayName: name,
		},
	}
}

export function sensorOccurrenceKey(deviceId: string, order: number) {
	return `${deviceId}\0${order}`
}

function transformSensor(
	value: LegacySensor,
	deviceId: string,
	order: number,
): TransformResult<MigratedSensor> {
	const id = legacyId(value._id)
	if (!id) {
		return { ok: false, code: 'sensor_missing_id', details: { order } }
	}
	const title = asTrimmedString(value.title)
	return {
		ok: true,
		warnings: title ? [] : ['sensor_title_defaulted'],
		value: {
			id,
			deviceId,
			title: title ?? `Sensor ${id}`,
			unit: asTrimmedString(value.unit),
			sensorType: asTrimmedString(value.sensorType),
			icon: asTrimmedString(value.icon),
			order,
		},
	}
}

export function transformDevice(
	box: LegacyBox,
	ownerId: string,
	validSensorIds?: ReadonlySet<string>,
	sensorTargetIdByOccurrence?: ReadonlyMap<string, string>,
): TransformResult<MigratedDevice> {
	const id = legacyId(box._id)
	const primaryCoordinates = primaryDeviceCoordinates(box)
	if (!id || !primaryCoordinates) {
		return {
			ok: false,
			code: id ? 'invalid_device_location' : 'device_missing_id',
			details: {
				hasId: Boolean(id),
				hasLocation: Boolean(primaryCoordinates),
			},
		}
	}
	const { createdAt, updatedAt } = deviceDates(box)
	const modelValue = asTrimmedString(box.model) ?? 'custom'
	const model = TARGET_MODELS.has(modelValue) ? modelValue : 'custom'
	const exposureValue =
		asTrimmedString(box.exposure)?.toLowerCase() ?? 'unknown'
	const exposure = deviceExposure(box)
	const locations = deviceLocations(box)
	const coordinates = locations.at(-1)!
	const heightAboveGround = primaryDeviceHeightAboveGround(box)
	const warnings: string[] = []
	if (model !== modelValue) warnings.push('unsupported_model_mapped_to_custom')
	if (exposure !== exposureValue)
		warnings.push('invalid_exposure_mapped_to_unknown')
	if (heightAboveGround.malformed)
		warnings.push('invalid_height_above_ground_omitted')

	const sensors: MigratedSensor[] = []
	if (Array.isArray(box.sensors)) {
		box.sensors.forEach((raw, order) => {
			if (!raw || typeof raw !== 'object') return
			const result = transformSensor(raw as LegacySensor, id, order)
			if (!result.ok) return
			const targetId =
				sensorTargetIdByOccurrence?.get(sensorOccurrenceKey(id, order)) ??
				result.value.id
			if (validSensorIds && !validSensorIds.has(targetId)) return
			sensors.push({ ...result.value, id: targetId })
			warnings.push(...result.warnings)
		})
	}

	return {
		ok: true,
		warnings,
		value: {
			id,
			userId: ownerId,
			name: asTrimmedString(box.name) ?? `Device ${id}`,
			description: asTrimmedString(box.description),
			link: asTrimmedString(box.weblink),
			tags: normalizeTags(box.grouptag),
			exposure,
			model,
			useAuth: box.useAuth === true,
			public: true,
			createdAt,
			updatedAt,
			latitude: coordinates.latitude,
			longitude: coordinates.longitude,
			heightAboveGround: heightAboveGround.value,
			locations,
			sensors,
		},
	}
}

export function parseStrictFiniteNumber(value: unknown): number | null {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	if (
		!trimmed ||
		!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)
	) {
		return null
	}
	const parsed = Number(trimmed)
	return Number.isFinite(parsed) ? parsed : null
}

export function transformMeasurement(
	measurement: LegacyMeasurement,
	expectedSensorId: string,
	from: Date,
	to: Date,
): TransformResult<MigratedMeasurement> {
	const sourceId = legacyId(measurement._id)
	const sensorId = legacyId(measurement.sensor_id)
	const time = asDate(measurement.createdAt)
	const value = parseStrictFiniteNumber(measurement.value)
	if (!sourceId || !sensorId || sensorId !== expectedSensorId) {
		return {
			ok: false,
			code: 'invalid_measurement_sensor',
			details: { sourceId, sensorId, expectedSensorId },
		}
	}
	if (!time || time < from || time >= to) {
		return {
			ok: false,
			code: 'invalid_measurement_time',
			details: { sourceId, hasTime: Boolean(time) },
		}
	}
	if (value === null) {
		return {
			ok: false,
			code: 'invalid_measurement_value',
			details: { sourceId },
		}
	}
	let location: Coordinates | null = null
	if (measurement.location != null) {
		location = coordinatesFromLegacy(measurement.location)
		if (!location) {
			return {
				ok: false,
				code: 'invalid_measurement_location',
				details: { sourceId },
			}
		}
	}
	return {
		ok: true,
		warnings: [],
		value: { sourceId, sensorId, time, value, location },
	}
}

function parseJsonObject(
	value: unknown,
): TransformResult<Record<string, unknown> | null> {
	if (value == null || value === '') {
		return { ok: true, value: null, warnings: [] }
	}
	let parsed = value
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value)
		} catch {
			return { ok: false, code: 'malformed_json', details: {} }
		}
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return { ok: false, code: 'json_must_be_object', details: {} }
	}
	return {
		ok: true,
		value: parsed as Record<string, unknown>,
		warnings: [],
	}
}

export function transformMqttIntegration(
	deviceId: string,
	config: LegacyMqttConfig | undefined,
): TransformResult<MigratedMqttIntegration | null> {
	if (!config) return { ok: true, value: null, warnings: [] }
	const enabled = config.enabled === true
	const url = asTrimmedString(config.url)
	const supportedUrl = Boolean(url && /^(?:mqtts?|wss?):\/\//i.test(url))
	const topic = asTrimmedString(config.topic)
	const rawFormat = asTrimmedString(config.messageFormat)?.toLowerCase()
	const messageFormat =
		rawFormat === 'json' || rawFormat === 'application/json'
			? 'json'
			: rawFormat === 'csv' || rawFormat === 'text/csv'
				? 'csv'
				: null
	if (rawFormat === 'debug_plain') {
		return {
			ok: false,
			code: 'unsupported_mqtt_format',
			details: { format: rawFormat },
		}
	}
	if (!enabled && (!url || !topic || !messageFormat)) {
		return {
			ok: true,
			value: null,
			warnings: ['disabled_incomplete_mqtt_skipped'],
		}
	}
	if (!url || !supportedUrl || !topic || !messageFormat) {
		return {
			ok: false,
			code: 'invalid_mqtt',
			details: {
				hasUrl: Boolean(url),
				supportedUrl,
				hasTopic: Boolean(topic),
				format: rawFormat ?? null,
			},
		}
	}
	const decodeOptions = parseJsonObject(config.decodeOptions)
	if (!decodeOptions.ok) {
		return { ...decodeOptions, code: `mqtt_decode_${decodeOptions.code}` }
	}
	const connectionOptions = parseJsonObject(config.connectionOptions)
	if (!connectionOptions.ok) {
		return {
			...connectionOptions,
			code: `mqtt_connection_${connectionOptions.code}`,
		}
	}
	return {
		ok: true,
		warnings: [],
		value: {
			id: `mqtt-${deviceId}`,
			deviceId,
			enabled,
			url,
			topic,
			messageFormat,
			decodeOptions: decodeOptions.value,
			connectionOptions: connectionOptions.value,
		},
	}
}

export function transformTtnIntegration(
	deviceId: string,
	config: LegacyTtnConfig | undefined,
): TransformResult<MigratedTtnIntegration | null> {
	if (!config) return { ok: true, value: null, warnings: [] }
	const devId = asTrimmedString(config.dev_id)
	const appId = asTrimmedString(config.app_id)
	const rawProfile = asTrimmedString(config.profile) ?? 'json'
	const port =
		config.port == null
			? null
			: typeof config.port === 'number'
				? config.port
				: typeof config.port === 'string' &&
					  /^[+-]?\d+$/.test(config.port.trim())
					? Number(config.port.trim())
					: Number.NaN
	if (
		!devId ||
		!appId ||
		!TARGET_TTN_PROFILES.has(rawProfile) ||
		(port !== null &&
			(!Number.isSafeInteger(port) || port < 0 || port > 2_147_483_647))
	) {
		return {
			ok: false,
			code: 'invalid_ttn',
			details: {
				hasDevId: Boolean(devId),
				hasAppId: Boolean(appId),
				profile: rawProfile,
				port,
			},
		}
	}
	let decodeOptions: Array<Record<string, unknown>> | null = null
	if (config.decodeOptions != null) {
		let parsed = config.decodeOptions
		if (typeof parsed === 'string') {
			try {
				parsed = JSON.parse(parsed)
			} catch {
				return { ok: false, code: 'ttn_decode_malformed_json', details: {} }
			}
		}
		if (
			!Array.isArray(parsed) ||
			parsed.some(
				(item) => !item || typeof item !== 'object' || Array.isArray(item),
			)
		) {
			return { ok: false, code: 'ttn_decode_must_be_array', details: {} }
		}
		decodeOptions = parsed as Array<Record<string, unknown>>
	}
	return {
		ok: true,
		warnings: [],
		value: {
			id: `ttn-${deviceId}`,
			deviceId,
			enabled: true,
			devId,
			appId,
			port,
			profile: rawProfile as MigratedTtnIntegration['profile'],
			decodeOptions,
		},
	}
}

export function classifyDevice(
	ownerId: string | null,
	lastMeasurementAt: Date | null,
	archiveBefore: Date,
) {
	return {
		orphaned: ownerId === null,
		archived: lastMeasurementAt === null || lastMeasurementAt < archiveBefore,
	}
}

export function locationAt(
	locations: NormalizedLocation[],
	time: Date,
): Coordinates | null {
	let selected: NormalizedLocation | null = null
	for (const location of locations) {
		if (location.time > time) continue
		if (!selected || selected.time < location.time) selected = location
	}
	return selected
		? { longitude: selected.longitude, latitude: selected.latitude }
		: null
}
