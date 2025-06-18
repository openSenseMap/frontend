import { point } from '@turf/helpers'
import { eq, sql, desc } from 'drizzle-orm'
import { type Point } from 'geojson'
import { drizzleClient } from '~/db.server'
import { device, location, sensor, type Device, type Sensor } from '~/schema'

export function getDevice({ id }: Pick<Device, 'id'>) {
	return drizzleClient.query.device.findFirst({
		where: (device, { eq }) => eq(device.id, id),
		columns: {
			createdAt: true,
			description: true,
			exposure: true,
			id: true,
			image: true,
			latitude: true,
			longitude: true,
			link: true,
			model: true,
			name: true,
			sensorWikiModel: true,
			status: true,
			updatedAt: true,
			tags: true,
			expiresAt: true,
		},
		with: {
			user: {
				columns: {
					id: true
				}
			},
			logEntries: {
				where: (entry, { eq }) => eq(entry.public, true),
				columns: {
					id: true,
					content: true,
					createdAt: true,
					public: true,
					deviceId: true,
				},
			},
			locations: {
				// https://github.com/drizzle-team/drizzle-orm/pull/2778
				// with: {
				//   geometry: true
				// },
				columns: {
					// time: true,
				},
				extras: {
					time: sql<Date>`time`.as('time'),
				},
				with: {
					geometry: {
						columns: {},
						extras: {
							x: sql<number>`ST_X(${location.location})`.as('x'),
							y: sql<number>`ST_Y(${location.location})`.as('y'),
						},
					},
				},
				// limit: 1000,
			},
		},
	})
}

export function getDeviceWithoutSensors({ id }: Pick<Device, 'id'>) {
	return drizzleClient.query.device.findFirst({
		where: (device, { eq }) => eq(device.id, id),
		columns: {
			id: true,
			name: true,
			exposure: true,
			updatedAt: true,
			latitude: true,
			longitude: true,
		},
	})
}

export function updateDeviceInfo({
	id,
	name,
	exposure,
}: Pick<Device, 'id' | 'name' | 'exposure'>) {
	return drizzleClient
		.update(device)
		.set({ name: name, exposure: exposure })
		.where(eq(device.id, id))
}

export function updateDeviceLocation({
	id,
	latitude,
	longitude,
}: Pick<Device, 'id' | 'latitude' | 'longitude'>) {
	return drizzleClient
		.update(device)
		.set({ latitude: latitude, longitude: longitude })
		.where(eq(device.id, id))
}

export function deleteDevice({ id }: Pick<Device, 'id'>) {
	return drizzleClient.delete(device).where(eq(device.id, id))
}

export function getUserDevices(userId: Device['userId']) {
	return drizzleClient.query.device.findMany({
		where: (device, { eq }) => eq(device.userId, userId),
		columns: {
			id: true,
			name: true,
			latitude: true,
			longitude: true,
			exposure: true,
			model: true,
			createdAt: true,
			updatedAt: true,
		},
	})
}

export async function getDevices() {
	const devices = await drizzleClient.query.device.findMany({
		columns: {
			id: true,
			name: true,
			latitude: true,
			longitude: true,
			exposure: true,
			status: true,
			createdAt: true,
			tags: true,
		},
	})
	const geojson: GeoJSON.FeatureCollection<Point> = {
		type: 'FeatureCollection',
		features: [],
	}

	for (const device of devices) {
		const coordinates = [device.longitude, device.latitude]
		const feature = point(coordinates, device)
		geojson.features.push(feature)
	}

	return geojson
}

export async function getDevicesWithSensors() {
	const rows = await drizzleClient
		.select({
			device: device,
			sensor: {
				id: sensor.id,
				title: sensor.title,
				sensorWikiPhenomenon: sensor.sensorWikiPhenomenon,
				lastMeasurement: sensor.lastMeasurement,
			},
		})
		.from(device)
		.leftJoin(sensor, eq(sensor.deviceId, device.id))
	const geojson: GeoJSON.FeatureCollection<Point, any> = {
		type: 'FeatureCollection',
		features: [],
	}

	type PartialSensor = Pick<
		Sensor,
		'id' | 'title' | 'sensorWikiPhenomenon' | 'lastMeasurement'
	>
	const deviceMap = new Map<
		string,
		{ device: Device & { sensors: PartialSensor[] } }
	>()

	const resultArray: Array<{ device: Device & { sensors: PartialSensor[] } }> =
		rows.reduce(
			(acc, row) => {
				const device = row.device
				const sensor = row.sensor

				if (!deviceMap.has(device.id)) {
					const newDevice = {
						device: { ...device, sensors: sensor ? [sensor] : [] },
					}
					deviceMap.set(device.id, newDevice)
					acc.push(newDevice)
				} else if (sensor) {
					deviceMap.get(device.id)!.device.sensors.push(sensor)
				}

				return acc
			},
			[] as Array<{ device: Device & { sensors: PartialSensor[] } }>,
		)

	for (const device of resultArray) {
		const coordinates = [device.device.longitude, device.device.latitude]
		const feature = point(coordinates, device.device)
		geojson.features.push(feature)
	}

	return geojson
}

export async function createDevice(deviceData: any, userId: string) {
	try {
		const newDevice = await drizzleClient.transaction(async (tx) => {
			// Create the device
			const [createdDevice] = await tx
				.insert(device)
				.values({
					id: deviceData.id,
					useAuth: deviceData.useAuth ?? true,
					model: deviceData.model,
					tags: deviceData.tags,
					userId: userId,
					name: deviceData.name,
					exposure: deviceData.exposure,
					expiresAt: deviceData.expiresAt
						? new Date(deviceData.expiresAt)
						: null,
					latitude: deviceData.latitude,
					longitude: deviceData.longitude,
				})
				.returning()

			if (!createdDevice) {
				throw new Error('Failed to create device.')
			}
			// Add sensors in the same transaction
			if (deviceData.sensors && Array.isArray(deviceData.sensors)) {
				for (const sensorData of deviceData.sensors) {
					await tx.insert(sensor).values({
						title: sensorData.title,
						unit: sensorData.unit,
						sensorType: sensorData.sensorType,
						deviceId: createdDevice.id, // Reference the created device ID
					})
				}
			}
			return createdDevice
		})
		return newDevice
	} catch (error) {
		console.error('Error creating device with sensors:', error)
		throw new Error('Failed to create device and its sensors.')
	}
}

// get the 10 latest created (createdAt property) devices with id, name, latitude, and longitude
export async function getLatestDevices() {
	const devices = await drizzleClient
		.select({
			id: device.id,
			name: device.name,
			latitude: device.latitude,
			longitude: device.longitude,
		})
		.from(device)
		.orderBy(desc(device.createdAt))
		.limit(10)

	return devices
}
