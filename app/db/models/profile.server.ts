import { eq, count, inArray } from 'drizzle-orm'
import { type User, type Profile, profile, measurement } from '~/db/schema'
import { drizzleClient, type DrizzleTransaction } from '~/db.server'
import { formatCount } from '~/lib/numbers'

export async function getProfileByUserId(userId: User['id']) {
	return drizzleClient.query.profile.findFirst({
		where: { userId },
		with: {
			profileImage: true,
			user: {
				with: {
					devices: true,
				},
			},
		},
	})
}

export async function getProfileByUsername(username: string) {
	const userRecord = await drizzleClient.query.user.findFirst({
		where: { name: username },
	})
	if (!userRecord) return null
	return getProfileByUserId(userRecord.id)
}

export async function updateProfile(
	id: Profile['id'],
	values: {
		displayName: Profile['displayName']
		public: boolean
		homeLatitude?: number | null
		homeLongitude?: number | null
		homeZoom?: number | null
	},
) {
	const updateValues: Partial<Profile> = {
		displayName: values.displayName,
		public: values.public,
	}

	if ('homeLatitude' in values) updateValues.homeLatitude = values.homeLatitude
	if ('homeLongitude' in values)
		updateValues.homeLongitude = values.homeLongitude
	if ('homeZoom' in values) updateValues.homeZoom = values.homeZoom

	const [updatedProfile] = await drizzleClient
		.update(profile)
		.set(updateValues)
		.where(eq(profile.id, id))
		.returning()

	return updatedProfile
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
	transaction: DrizzleTransaction,
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
		where: { userId },
	})
	const deviceIds = devices.map((device) => device.id)

	if (deviceIds.length === 0) {
		return { sensorsCount: '0', measurementsCount: '0' }
	}

	// Get sensor IDs for measurements count
	const sensors = await drizzleClient.query.sensor.findMany({
		where: { deviceId: { in: deviceIds } },
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
