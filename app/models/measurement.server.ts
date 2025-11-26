import { and, desc, eq, lte, sql } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { deviceToLocation, location, measurement, sensor } from '~/schema'

interface MeasurementWithLocation {
	sensor_id: string
	value: number
	createdAt?: Date
	location?: {
		lng: number
		lat: number
		height?: number
	} | null
}

interface MeasurementWithLocation {
	sensor_id: string
	value: number
	createdAt?: Date
	location?: {
		lng: number
		lat: number
		height?: number
	} | null
}

/**
 * Get the device location that was valid at a specific timestamp
 * Returns the most recent location that was set before or at the given timestamp
 */
async function getDeviceLocationAtTime(
	tx: any,
	deviceId: string,
	timestamp: Date,
): Promise<bigint | null> {
	const locationAtTime = await tx
		.select({
			locationId: deviceToLocation.locationId,
		})
		.from(deviceToLocation)
		.where(
			and(
				eq(deviceToLocation.deviceId, deviceId),
				lte(deviceToLocation.time, timestamp),
			),
		)
		.orderBy(desc(deviceToLocation.time))
		.limit(1)

	return locationAtTime.length > 0 ? locationAtTime[0].locationId : null
}

async function findOrCreateLocation(
	tx: any,
	lng: number,
	lat: number,
): Promise<bigint> {
	const existingLocation = await tx
		.select({ id: location.id })
		.from(location)
		.where(
			sql`ST_Equals(
        ${location.location}, 
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )`,
		)
		.limit(1)

	if (existingLocation.length > 0) {
		return existingLocation[0].id
	}

	const [newLocation] = await tx
		.insert(location)
		.values({
			location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
		})
		.returning()

	return newLocation.id
}

export async function saveMeasurements(
	device: any,
	measurements: MeasurementWithLocation[],
): Promise<void> {
	if (!Array.isArray(measurements)) throw new Error('Array expected')

	const sensorIds = device.sensors.map((s: any) => s.id)
	const lastMeasurements: Record<string, any> = {}

	// Track measurements that update device location (those with explicit locations)
	const deviceLocationUpdates: Array<{
		location: { lng: number; lat: number; height?: number }
		time: Date
	}> = []

	// Validate and prepare measurements
	for (let i = measurements.length - 1; i >= 0; i--) {
		const m = measurements[i]

		if (!sensorIds.includes(m.sensor_id)) {
			const error = new Error(
				`Measurement for sensor with id ${m.sensor_id} does not belong to box`,
			)
			error.name = 'ModelError'
			throw error
		}

		const now = new Date()
		const maxFutureTime = 30 * 1000 // 30 seconds

		const measurementTime = new Date(m.createdAt || Date.now())
		if (measurementTime.getTime() > now.getTime() + maxFutureTime) {
			const error = new Error(
				`Measurement timestamp is too far in the future: ${measurementTime.toISOString()}`,
			)
			error.name = 'ModelError'
			;(error as any).type = 'UnprocessableEntityError'
			throw error
		}

		if (!lastMeasurements[m.sensor_id]) {
			lastMeasurements[m.sensor_id] = {
				value: m.value,
				createdAt: measurementTime.toISOString(),
				sensorId: m.sensor_id,
			}
		}

		// Track measurements with explicit locations for device location updates
		if (m.location) {
			deviceLocationUpdates.push({
				location: m.location,
				time: measurementTime,
			})
		}
	}

	// Sort device location updates by time (oldest first) to process in order
	deviceLocationUpdates.sort((a, b) => a.time.getTime() - b.time.getTime())

	await drizzleClient.transaction(async (tx) => {
		// First, update device locations for all measurements with explicit locations
		// This ensures the location history is complete before we infer locations
		for (const update of deviceLocationUpdates) {
			const locationId = await findOrCreateLocation(
				tx,
				update.location.lng,
				update.location.lat,
			)

			// Check if we should add this to device location history
			// Only add if it's newer than the current latest location
			const currentLatestLocation = await tx
				.select({ time: deviceToLocation.time })
				.from(deviceToLocation)
				.where(eq(deviceToLocation.deviceId, device.id))
				.orderBy(desc(deviceToLocation.time))
				.limit(1)

			const shouldAdd =
				currentLatestLocation.length === 0 ||
				update.time >= currentLatestLocation[0].time

			if (shouldAdd) {
				await tx
					.insert(deviceToLocation)
					.values({
						deviceId: device.id,
						locationId: locationId,
						time: update.time,
					})
					.onConflictDoNothing()
			}
		}

		// Now process each measurement and infer locations if needed
		for (const m of measurements) {
			const measurementTime = m.createdAt || new Date()
			let locationId: bigint | null = null

			if (m.location) {
				// Measurement has explicit location
				locationId = await findOrCreateLocation(
					tx,
					m.location.lng,
					m.location.lat,
				)
			} else {
				// No explicit location - infer from device location history
				locationId = await getDeviceLocationAtTime(
					tx,
					device.id,
					measurementTime,
				)
			}

			// Insert measurement with locationId (may be null for measurements
			// without location and before any device location was set)
			await tx
				.insert(measurement)
				.values({
					sensorId: m.sensor_id,
					value: m.value,
					time: measurementTime,
					locationId: locationId,
				})
				.onConflictDoNothing()
		}

		// Update sensor lastMeasurement values
		const updatePromises = Object.entries(lastMeasurements).map(
			([sensorId, lastMeasurement]) =>
				tx
					.update(sensor)
					.set({ lastMeasurement })
					.where(eq(sensor.id, sensorId)),
		)

		await Promise.all(updatePromises)
	})
}

export async function insertMeasurements(measurements: any[]): Promise<void> {
	const measurementInserts = measurements.map((measurement) => ({
		sensorId: measurement.sensor_id,
		value: measurement.value,
		time: measurement.createdAt || new Date(),
	}))

	await drizzleClient.insert(measurement).values(measurementInserts)
}

export async function deleteMeasurementsForSensor(sensorId: string) {
	return await drizzleClient
		.delete(measurement)
		.where(eq(measurement.sensorId, sensorId))
}

export async function deleteMeasurementsForTime(date: Date) {
	return await drizzleClient
		.delete(measurement)
		.where(eq(measurement.time, date))
}
