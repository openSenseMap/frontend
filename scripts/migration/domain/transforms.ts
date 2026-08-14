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

export function deviceLocations(box: LegacyBox, fallbackTime: Date) {
	const candidates: NormalizedLocation[] = []
	const rawLocations = Array.isArray(box.locations) ? box.locations : []
	for (const raw of rawLocations) {
		const coordinates = coordinatesFromLegacy(raw)
		if (!coordinates) continue
		const time = asDate(
			raw && typeof raw === 'object'
				? (raw as { timestamp?: unknown }).timestamp
				: null,
			fallbackTime,
		)!
		candidates.push({ ...coordinates, time })
	}

	const current = coordinatesFromLegacy(box.currentLocation)
	if (current) {
		const time = asDate(
			box.currentLocation && typeof box.currentLocation === 'object'
				? (box.currentLocation as { timestamp?: unknown }).timestamp
				: null,
			fallbackTime,
		)!
		candidates.push({ ...current, time })
	}

	const byTimestamp = new Map<string, NormalizedLocation>()
	for (const candidate of candidates.sort(
		(a, b) => a.time.getTime() - b.time.getTime(),
	)) {
		byTimestamp.set(candidate.time.toISOString(), candidate)
	}
	return [...byTimestamp.values()]
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
	const unconfirmedEmail =
		asTrimmedString(user.unconfirmedEmail)?.toLowerCase() ?? null
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
			unconfirmedEmail,
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
	validSensorIds?: Set<string>,
): TransformResult<MigratedDevice> {
	const id = legacyId(box._id)
	const coordinates = primaryDeviceCoordinates(box)
	if (!id || !coordinates) {
		return {
			ok: false,
			code: id ? 'invalid_device_location' : 'device_missing_id',
			details: { hasId: Boolean(id), hasLocation: Boolean(coordinates) },
		}
	}
	const createdAt = asDate(
		box.createdAt,
		dateFromLegacyId(box._id) ?? new Date(0),
	)!
	const updatedAt = asDate(box.updatedAt, createdAt)!
	const modelValue = asTrimmedString(box.model) ?? 'custom'
	const model = TARGET_MODELS.has(modelValue) ? modelValue : 'custom'
	const exposureValue =
		asTrimmedString(box.exposure)?.toLowerCase() ?? 'unknown'
	const exposure = TARGET_EXPOSURES.has(exposureValue)
		? (exposureValue as MigratedDevice['exposure'])
		: 'unknown'
	const warnings: string[] = []
	if (model !== modelValue) warnings.push('unsupported_model_mapped_to_custom')
	if (exposure !== exposureValue)
		warnings.push('invalid_exposure_mapped_to_unknown')

	const sensors: MigratedSensor[] = []
	if (Array.isArray(box.sensors)) {
		box.sensors.forEach((raw, order) => {
			if (!raw || typeof raw !== 'object') return
			const result = transformSensor(raw as LegacySensor, id, order)
			if (!result.ok) return
			if (validSensorIds && !validSensorIds.has(result.value.id)) return
			sensors.push(result.value)
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
			locations: deviceLocations(box, createdAt),
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
