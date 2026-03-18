import {
	eq,
	type ExtractTablesWithRelations,
	count,
	inArray,
} from 'drizzle-orm'
import { type PgTransaction } from 'drizzle-orm/pg-core'
import { type PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import { drizzleClient } from '~/db.server'
import { type User, type Profile, profile, measurement, user } from '~/schema'
import type * as schema from '~/schema'
import { formatCount } from '~/utils/misc'

export async function getProfileByUserId(userId: User['id']) {
	return drizzleClient.query.profile.findFirst({
		where: (profile, { eq }) => eq(profile.userId, userId),
		with: {
			profileImage: true,
			user: {
				with: {
					devices: true
				}
			}
		},
	})
}

export async function updateProfile(
	id: Profile['id'],
	displayName: Profile['displayName'],
	visibility: Profile['public'],
) {
	try {
		const result = await drizzleClient
			.update(profile)
			.set({ displayName, public: visibility })
			.where(eq(profile.id, id))
		return result
	} catch (error) {
		throw error
	}
}

export async function createProfile(
	userId: User['id'],
	displayName: Profile['displayName'],
) {
	return drizzleClient.transaction((t) =>
		createProfileWithTransaction(t, userId, displayName),
	)
}

export async function createProfileWithTransaction(
	transaction: PgTransaction<
		PostgresJsQueryResultHKT,
		typeof schema,
		ExtractTablesWithRelations<typeof schema>
	>,
	userId: User['id'],
	displayName: Profile['displayName'],
) {
	return transaction.insert(profile).values({
		displayName,
		public: false,
		userId,
	})
}

// function to get sensors and measurements count for a profile
export async function getProfileSensorsAndMeasurementsCount(profile: Profile) {
	const userId = profile.userId
	if (userId == null) return { sensorsCount: '0', measurementsCount: '0' }

	const devices = await drizzleClient.query.device.findMany({
		where: (device, { eq }) => eq(device.userId, userId),
	})
	const deviceIds = devices.map((device) => device.id)

	if (deviceIds.length === 0) {
		return { sensorsCount: '0', measurementsCount: '0' }
	}

	// Get sensor IDs for measurements count
	const sensors = await drizzleClient.query.sensor.findMany({
		where: (s, { inArray }) => inArray(s.deviceId, deviceIds),
		columns: { id: true },
	})
	const sensorsCount = sensors.length
	const sensorIds = sensors.map((s) => s.id)

	// Count measurements using COUNT query
	let measurementsCount = 0
	if (sensorIds.length > 0) {
		const [measurementsResult] = await drizzleClient
			.select({ count: count(measurement.value) })
			.from(measurement)
			.where(inArray(measurement.sensorId, sensorIds))

		measurementsCount = measurementsResult.count
	}

	return {
		sensorsCount: formatCount(sensorsCount),
		measurementsCount: formatCount(measurementsCount),
	}
}
