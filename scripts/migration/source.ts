import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import {
	type Collection,
	type Db,
	type MongoClient as MongoClientType,
} from 'mongodb'
import {
	deviceLocationTimestampAnomaly,
	legacyId,
	primaryDeviceCoordinates,
	sensorOccurrenceKey,
	transformUser,
} from './domain/transforms'
import {
	type LegacyBox,
	type LegacyMeasurement,
	type LegacyUser,
	type SourceSnapshot,
} from './types'

// mongodb@3.7 is CommonJS. Named ESM imports fail at runtime under Node/tsx even
// though the DefinitelyTyped declarations expose named exports.
const mongodb = createRequire(import.meta.url)(
	'mongodb',
) as typeof import('mongodb')
const { MongoClient, ObjectId } = mongodb

export type MeasurementIndexFingerprint = {
	name: string
	key: Record<string, number | string>
}

export type UnexpectedMeasurementSensorCount = {
	sensorId: string
	count: number
}

type MongoIndexDocument = {
	name?: unknown
	key?: unknown
	sparse?: unknown
	partialFilterExpression?: unknown
	hidden?: unknown
}

function isIndexDirection(value: unknown): value is 1 | -1 {
	return value === 1 || value === -1
}

export function selectCompatibleMeasurementIndex(
	indexes: readonly MongoIndexDocument[],
): MeasurementIndexFingerprint | null {
	const compatible = indexes.flatMap((index) => {
		if (
			typeof index.name !== 'string' ||
			!index.key ||
			typeof index.key !== 'object' ||
			index.sparse === true ||
			index.partialFilterExpression != null ||
			index.hidden === true
		) {
			return []
		}
		const entries = Object.entries(index.key as Record<string, unknown>)
		if (
			entries[0]?.[0] !== 'sensor_id' ||
			!isIndexDirection(entries[0]?.[1]) ||
			entries[1]?.[0] !== 'createdAt' ||
			!isIndexDirection(entries[1]?.[1])
		) {
			return []
		}
		return [
			{
				name: index.name,
				key: Object.fromEntries(entries) as Record<string, number | string>,
			},
		]
	})

	compatible.sort((a, b) => {
		const keyCount = Object.keys(a.key).length - Object.keys(b.key).length
		return keyCount || a.name.localeCompare(b.name)
	})
	return compatible[0] ?? null
}

function idsFromUnknown(value: unknown) {
	if (!Array.isArray(value)) return []
	return value.map(legacyId).filter((id): id is string => Boolean(id))
}

type SensorOccurrence = {
	deviceId: string
	order: number
}

function commonPrefixLength(left: string, right: string) {
	const limit = Math.min(left.length, right.length)
	let length = 0
	while (length < limit && left[length] === right[length]) length++
	return length
}

function compareSensorOrigins(sensorId: string) {
	return (left: SensorOccurrence, right: SensorOccurrence) => {
		const prefixDifference =
			commonPrefixLength(sensorId, right.deviceId) -
			commonPrefixLength(sensorId, left.deviceId)
		return (
			prefixDifference ||
			left.deviceId.localeCompare(right.deviceId) ||
			left.order - right.order
		)
	}
}

function replacementSensorId(
	sourceSensorId: string,
	occurrence: SensorOccurrence,
	reservedIds: ReadonlySet<string>,
) {
	let attempt = 0
	while (true) {
		const id = createHash('sha256')
			.update(
				`opensensemap-migration-sensor-copy-v1\0${sourceSensorId}\0${occurrence.deviceId}\0${occurrence.order}\0${attempt}`,
			)
			.digest('hex')
			.slice(0, 24)
		if (!reservedIds.has(id)) return id
		attempt++
	}
}

function addNaturalKeyConflicts(
	users: LegacyUser[],
	validUserIds: Set<string>,
	potentiallyRetainedUserIds: ReadonlySet<string>,
	anomalies: SourceSnapshot['anomalies'],
) {
	const keys = new Map<string, string[]>()
	for (const user of users) {
		const transformed = transformUser(user)
		if (!transformed.ok) continue
		if (!potentiallyRetainedUserIds.has(transformed.value.id)) continue
		for (const key of [
			`name:${transformed.value.name}`,
			`email:${transformed.value.email}`,
		]) {
			const current = keys.get(key) ?? []
			if (!current.includes(transformed.value.id)) {
				current.push(transformed.value.id)
			}
			keys.set(key, current)
		}
	}
	for (const [key, ids] of keys) {
		if (ids.length < 2) continue
		for (const id of ids) validUserIds.delete(id)
		anomalies.push({
			code: 'duplicate_user_natural_key',
			collection: 'users',
			details: { keyType: key.split(':', 1)[0], userIds: ids },
		})
	}
}

export function buildSourceSnapshot(
	users: LegacyUser[],
	boxes: LegacyBox[],
): SourceSnapshot {
	const anomalies: SourceSnapshot['anomalies'] = []
	const boxById = new Map<string, LegacyBox>()
	const migratableDeviceIds = new Set<string>()

	for (const box of boxes) {
		const id = legacyId(box._id)
		if (!id) {
			anomalies.push({
				code: 'device_missing_id',
				collection: 'boxes',
				details: {},
			})
			continue
		}
		boxById.set(id, box)
		if (!primaryDeviceCoordinates(box)) {
			anomalies.push({
				code: 'invalid_device_location',
				collection: 'boxes',
				sourceId: id,
				details: {},
			})
			continue
		}
		migratableDeviceIds.add(id)
		const locationTimestampAnomaly = deviceLocationTimestampAnomaly(box)
		if (locationTimestampAnomaly) {
			anomalies.push({
				code: 'implausible_device_location_timestamps',
				collection: 'boxes',
				sourceId: id,
				details: locationTimestampAnomaly,
			})
		}
	}

	const validUserIds = new Set<string>()
	for (const user of users) {
		const transformed = transformUser(user)
		if (transformed.ok) validUserIds.add(transformed.value.id)
		else {
			anomalies.push({
				code: transformed.code,
				collection: 'users',
				sourceId: legacyId(user._id) ?? undefined,
				details: transformed.details,
			})
		}
	}
	const ownerCandidates = new Map<string, string[]>()
	for (const user of users) {
		const userId = legacyId(user._id)
		if (!userId) continue
		for (const deviceId of idsFromUnknown(user.boxes)) {
			if (!boxById.has(deviceId)) {
				anomalies.push({
					code: 'dangling_user_device_reference',
					collection: 'users',
					sourceId: userId,
					details: { deviceId },
				})
				continue
			}
			if (!migratableDeviceIds.has(deviceId)) continue
			const candidates = ownerCandidates.get(deviceId) ?? []
			candidates.push(userId)
			ownerCandidates.set(deviceId, candidates)
		}
		const sharedIds = idsFromUnknown(user.sharedBoxes)
		if (sharedIds.length > 0) {
			anomalies.push({
				code: 'shared_device_acl_not_migrated',
				collection: 'users',
				sourceId: userId,
				details: { count: sharedIds.length },
			})
		}
	}
	const potentiallyRetainedUserIds = new Set<string>()
	for (const deviceId of migratableDeviceIds) {
		const candidates = [...new Set(ownerCandidates.get(deviceId) ?? [])]
		if (candidates.length === 1 && validUserIds.has(candidates[0])) {
			potentiallyRetainedUserIds.add(candidates[0])
		}
	}
	addNaturalKeyConflicts(
		users,
		validUserIds,
		potentiallyRetainedUserIds,
		anomalies,
	)

	const ownerByDeviceId = new Map<string, string | null>()
	const retainedUserIds = new Set<string>()
	for (const deviceId of migratableDeviceIds) {
		const candidates = [...new Set(ownerCandidates.get(deviceId) ?? [])]
		if (candidates.length === 1 && validUserIds.has(candidates[0])) {
			ownerByDeviceId.set(deviceId, candidates[0])
			retainedUserIds.add(candidates[0])
			continue
		}
		ownerByDeviceId.set(deviceId, null)
		if (candidates.length > 1) {
			anomalies.push({
				code: 'multiple_device_owners_orphaned',
				collection: 'boxes',
				sourceId: deviceId,
				details: { ownerIds: candidates },
			})
		} else if (candidates.length === 1) {
			anomalies.push({
				code: 'invalid_device_owner_orphaned',
				collection: 'boxes',
				sourceId: deviceId,
				details: { ownerId: candidates[0] },
			})
		} else {
			anomalies.push({
				code: 'device_without_owner_orphaned',
				collection: 'boxes',
				sourceId: deviceId,
				details: {},
			})
		}
	}

	const sensorCandidates = new Map<string, SensorOccurrence[]>()
	for (const [deviceId, box] of boxById) {
		if (!migratableDeviceIds.has(deviceId) || !Array.isArray(box.sensors))
			continue
		for (const [order, rawSensor] of box.sensors.entries()) {
			if (!rawSensor || typeof rawSensor !== 'object') {
				anomalies.push({
					code: 'invalid_sensor_shape',
					collection: 'boxes',
					sourceId: deviceId,
					details: { order },
				})
				continue
			}
			const sensorId = legacyId((rawSensor as { _id?: unknown })._id)
			if (!sensorId) {
				anomalies.push({
					code: 'sensor_missing_id',
					collection: 'boxes',
					sourceId: deviceId,
					details: {},
				})
				continue
			}
			const candidates = sensorCandidates.get(sensorId) ?? []
			candidates.push({ deviceId, order })
			sensorCandidates.set(sensorId, candidates)
		}
	}
	const sensorToDeviceId = new Map<string, string | null>()
	const sensorTargetIdByOccurrence = new Map<string, string>()
	const reservedSensorIds = new Set(sensorCandidates.keys())
	for (const [sensorId, occurrences] of [...sensorCandidates].sort(
		([left], [right]) => left.localeCompare(right),
	)) {
		const ordered = [...occurrences].sort(compareSensorOrigins(sensorId))
		const canonical = ordered[0]
		sensorToDeviceId.set(sensorId, canonical.deviceId)
		sensorTargetIdByOccurrence.set(
			sensorOccurrenceKey(canonical.deviceId, canonical.order),
			sensorId,
		)
		if (ordered.length > 1) {
			const reassignments = ordered.slice(1).map((occurrence) => {
				const targetSensorId = replacementSensorId(
					sensorId,
					occurrence,
					reservedSensorIds,
				)
				reservedSensorIds.add(targetSensorId)
				sensorToDeviceId.set(targetSensorId, occurrence.deviceId)
				sensorTargetIdByOccurrence.set(
					sensorOccurrenceKey(occurrence.deviceId, occurrence.order),
					targetSensorId,
				)
				return { ...occurrence, targetSensorId }
			})
			anomalies.push({
				code: 'duplicate_sensor_id_reassigned',
				collection: 'boxes',
				sourceId: sensorId,
				details: {
					deviceIds: [...new Set(ordered.map(({ deviceId }) => deviceId))],
					occurrences: ordered.length,
					canonicalDeviceId: canonical.deviceId,
					canonicalOrder: canonical.order,
					reassignments,
				},
			})
		}
	}

	return {
		users,
		boxes,
		boxById,
		ownerByDeviceId,
		retainedUserIds,
		sensorToDeviceId,
		sensorTargetIdByOccurrence,
		migratableDeviceIds,
		anomalies,
	}
}

function toLegacyBox(document: Record<string, unknown>) {
	return document as LegacyBox
}

function toLegacyUser(document: Record<string, unknown>) {
	return document as LegacyUser
}

function sourceIdQuery(value: string) {
	return ObjectId.isValid(value) ? { $in: [new ObjectId(value), value] } : value
}

export class MongoSource {
	private readonly client: MongoClientType
	private db?: Db
	private snapshot?: SourceSnapshot
	private measurementIndexPromise?: Promise<MeasurementIndexFingerprint>

	constructor(
		url: string,
		private readonly databaseName: string,
		readPreference: 'primary' | 'secondaryPreferred' = 'primary',
	) {
		this.client = new MongoClient(url, {
			appname: 'opensensemap-vnext-migration',
			readPreference,
			readConcern: { level: 'majority' },
			useUnifiedTopology: true,
		})
	}

	async connect() {
		await this.client.connect()
		this.db = this.client.db(this.databaseName)
		await this.db.command({ ping: 1 })
	}

	async close() {
		await this.client.close()
	}

	private getDb() {
		if (!this.db) throw new Error('Mongo source has not been connected')
		return this.db
	}

	private async measurementIndex() {
		if (!this.measurementIndexPromise) {
			this.measurementIndexPromise = this.inspectMeasurementIndex()
		}
		return this.measurementIndexPromise
	}

	private async inspectMeasurementIndex() {
		let indexes: MongoIndexDocument[]
		try {
			indexes = (await this.measurementCollection()
				.listIndexes()
				.toArray()) as MongoIndexDocument[]
		} catch (error) {
			this.measurementIndexPromise = undefined
			throw new Error(
				`Could not inspect MongoDB measurements indexes: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
		const index = selectCompatibleMeasurementIndex(indexes)
		if (!index) {
			this.measurementIndexPromise = undefined
			throw new Error(
				'MongoDB measurements requires a non-sparse, non-partial compound index with sensor_id first and createdAt second',
			)
		}
		return index
	}

	async fingerprint() {
		const db = this.getDb()
		const [buildInfo, collections, measurementIndex] = await Promise.all([
			db.command({ buildInfo: 1 }),
			db.listCollections({}, { nameOnly: false }).toArray(),
			this.measurementIndex(),
		])
		let hello: Record<string, unknown>
		try {
			hello = await db.admin().command({ hello: 1 })
		} catch {
			hello = await db.admin().command({ isMaster: 1 })
		}
		const schemaVersion = await db
			.collection('schemaVersion')
			.findOne({}, { sort: { schemaVersion: -1 } })
		return {
			database: this.databaseName,
			serverVersion: buildInfo.version,
			maxWireVersion: hello.maxWireVersion,
			replicaSet: hello.setName ?? null,
			schemaVersion:
				Number(
					schemaVersion?.schemaVersion ??
						schemaVersion?.version ??
						schemaVersion?.currentVersion,
				) || null,
			measurementIndex,
			collections: collections
				.map((collection) => ({
					name: collection.name,
					uuid: collection.info?.uuid?.toString?.() ?? null,
				}))
				.sort((a, b) => a.name.localeCompare(b.name)),
		}
	}

	async loadSnapshot() {
		if (this.snapshot) return this.snapshot
		const db = this.getDb()
		const [users, boxes] = await Promise.all([
			db
				.collection('users')
				.find(
					{},
					{
						projection: {
							_id: 1,
							name: 1,
							email: 1,
							boxes: 1,
							sharedBoxes: 1,
							language: 1,
							hashedPassword: 1,
							role: 1,
							emailIsConfirmed: 1,
							createdAt: 1,
							updatedAt: 1,
						},
					},
				)
				.map(toLegacyUser)
				.toArray(),
			db
				.collection('boxes')
				.find(
					{},
					{
						projection: {
							_id: 1,
							name: 1,
							locations: 1,
							currentLocation: 1,
							exposure: 1,
							grouptag: 1,
							model: 1,
							weblink: 1,
							description: 1,
							image: 1,
							sensors: 1,
							integrations: 1,
							access_token: 1,
							useAuth: 1,
							createdAt: 1,
							updatedAt: 1,
						},
					},
				)
				.map(toLegacyBox)
				.toArray(),
		])
		this.snapshot = buildSourceSnapshot(users, boxes)
		return this.snapshot
	}

	async counts(from: Date, to: Date) {
		const db = this.getDb()
		const [users, boxes, allMeasurements] = await Promise.all([
			db.collection('users').estimatedDocumentCount(),
			db.collection('boxes').estimatedDocumentCount(),
			db.collection('measurements').estimatedDocumentCount(),
		])
		return {
			users,
			boxes,
			allMeasurements,
			window: { from: from.toISOString(), to: to.toISOString() },
		}
	}

	private measurementCollection(): Collection<
		LegacyMeasurement & Record<string, unknown>
	> {
		return this.getDb().collection('measurements')
	}

	async unexpectedMeasurementSensorCounts(
		validSensorIds: ReadonlySet<string>,
		from: Date,
		to: Date,
	): Promise<UnexpectedMeasurementSensorCount[]> {
		const collection = this.measurementCollection()
		const index = await this.measurementIndex()
		// With sensor_id as the leading index field, an unfiltered distinct avoids
		// scanning measurement documents. Only unexpected IDs need window counts.
		const sourceSensorIds = await collection.distinct('sensor_id')
		const counts = new Map<string, number>()
		for (const sourceSensorId of sourceSensorIds) {
			const sensorId = legacyId(sourceSensorId)
			if (sensorId && validSensorIds.has(sensorId)) continue
			if (sourceSensorId == null) continue
			const count = await collection.countDocuments(
				{
					sensor_id: sourceSensorId as LegacyMeasurement['sensor_id'],
					createdAt: { $gte: from, $lt: to },
				},
				{ hint: index.name },
			)
			if (count > 0) {
				const key = sensorId ?? '[invalid-sensor-id]'
				counts.set(key, (counts.get(key) ?? 0) + count)
			}
		}
		const missingOrNull = await collection.countDocuments(
			{
				sensor_id: null,
				createdAt: { $gte: from, $lt: to },
			},
			{ hint: index.name },
		)
		if (missingOrNull > 0) {
			counts.set(
				'[invalid-sensor-id]',
				(counts.get('[invalid-sensor-id]') ?? 0) + missingOrNull,
			)
		}
		return [...counts]
			.map(([sensorId, count]) => ({ sensorId, count }))
			.sort((a, b) => a.sensorId.localeCompare(b.sensorId))
	}

	async *measurementGroupsForSensor(
		sensorId: string,
		from: Date,
		to: Date,
		startAfter?: Date,
	) {
		const index = await this.measurementIndex()
		const query: Record<string, unknown> = {
			sensor_id: sourceIdQuery(sensorId),
			createdAt: startAfter
				? { $gt: startAfter, $lt: to }
				: { $gte: from, $lt: to },
		}
		const cursor = this.measurementCollection()
			.find(query)
			.sort({ createdAt: 1 })
			.hint(index.name)
		let group: LegacyMeasurement[] = []
		let groupTime: number | null = null
		for await (const measurement of cursor) {
			const time = asValidDate(measurement.createdAt)
			if (!time) continue
			if (groupTime !== null && time.getTime() !== groupTime) {
				yield group.sort(compareMeasurementIds)
				group = []
			}
			groupTime = time.getTime()
			group.push(measurement as LegacyMeasurement)
		}
		if (group.length > 0) yield group.sort(compareMeasurementIds)
	}
}

function asValidDate(value: unknown) {
	const date = value instanceof Date ? value : new Date(String(value))
	return Number.isFinite(date.getTime()) ? date : null
}

function compareMeasurementIds(a: LegacyMeasurement, b: LegacyMeasurement) {
	return (legacyId(a._id) ?? '').localeCompare(legacyId(b._id) ?? '')
}
