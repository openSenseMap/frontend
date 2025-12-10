import {
	eq,
	type ExtractTablesWithRelations,
	count,
	inArray,
} from 'drizzle-orm'
import { type PgTransaction } from 'drizzle-orm/pg-core'
import { type PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import { drizzleClient } from '~/db.server'
import { type User, type Profile, profile, sensor, measurement } from '~/schema'
import type * as schema from '~/schema'

export async function getProfileByUserId(id: Profile['id']) {
	return drizzleClient.query.profile.findFirst({
		where: (profile, { eq }) => eq(profile.userId, id),
		with: {
			profileImage: true,
		},
	})
}

export async function getProfileByUsername(username: Profile['username']) {
	return drizzleClient.query.profile.findFirst({
		where: (profile, { eq }) => eq(profile.username, username),
		with: {
			user: {
				with: {
					devices: true,
				},
			},
			profileImage: true,
		},
	})
}

export async function updateProfile(
	id: Profile['id'],
	username: Profile['username'],
	visibility: Profile['public'],
) {
	try {
		const result = await drizzleClient
			.update(profile)
			.set({ username, public: visibility })
			.where(eq(profile.id, id))
		return result
	} catch (error) {
		throw error
	}
}

export async function createProfile(
	userId: User['id'],
	username: Profile['username'],
) {
	return drizzleClient.transaction((t) =>
		createProfileWithTransaction(t, userId, username),
	)
}

export async function createProfileWithTransaction(
	transaction: PgTransaction<
		PostgresJsQueryResultHKT,
		typeof schema,
		ExtractTablesWithRelations<typeof schema>
	>,
	userId: User['id'],
	username: Profile['username'],
) {
	return transaction.insert(profile).values({
		username,
		public: false,
		userId,
	})
}

function formatCount(num: number): string {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`
	}
	return num.toString()
}

// function to get sensors and measurements count for a profile
export async function getProfileSensorsandMeasurementsCount(profile: Profile) {
	const userId = profile.userId
	if (userId == null) return { sensorsCount: '0', measurementsCount: '0' }

	const devices = await drizzleClient.query.device.findMany({
		where: (device, { eq }) => eq(device.userId, userId),
	})
	const deviceIds = devices.map((device) => device.id)

	if (deviceIds.length === 0) {
		return { sensorsCount: '0', measurementsCount: '0' }
	}

	// Count sensors using COUNT query
	const [sensorsResult] = await drizzleClient
		.select({ count: count() })
		.from(sensor)
		.where(inArray(sensor.deviceId, deviceIds))

	const sensorsCount = sensorsResult.count

	// Get sensor IDs for measurements count
	const sensors = await drizzleClient.query.sensor.findMany({
		where: (s, { inArray }) => inArray(s.deviceId, deviceIds),
		columns: { id: true },
	})
	const sensorIds = sensors.map((s) => s.id)

	// Count measurements using COUNT query
	let measurementsCount = 0
	if (sensorIds.length > 0) {
		const [measurementsResult] = await drizzleClient
			.select({ count: count() })
			.from(measurement)
			.where(inArray(measurement.sensorId, sensorIds))

		measurementsCount = measurementsResult.count
	}

	return {
		sensorsCount: formatCount(sensorsCount),
		measurementsCount: formatCount(measurementsCount),
	}
}
