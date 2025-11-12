import { point } from '@turf/helpers'
import { eq, sql, desc, ilike, arrayContains, and, between } from 'drizzle-orm'
import { type Point } from 'geojson'
import { drizzleClient } from '~/db.server'
import { device, deviceToLocation, location, sensor, type Device, type Sensor } from '~/schema'

const BASE_DEVICE_COLUMNS = {
	id: true,
	name: true,
	description: true,
	image: true,
	link: true,
	tags: true,
	exposure: true,
	model: true,
	latitude: true,
	longitude: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	expiresAt: true,
	useAuth: true,
	sensorWikiModel: true,
} as const;

const DEVICE_COLUMNS_WITH_SENSORS = {
	...BASE_DEVICE_COLUMNS,
	useAuth: true,
	public: true,
	userId: true,
} as const;

export function getDevice({ id }: Pick<Device, 'id'>) {
	return drizzleClient.query.device.findFirst({
		where: (device, { eq }) => eq(device.id, id),
		columns: BASE_DEVICE_COLUMNS,
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
			sensors: true
		},
	})
}

export function getLocations({ id }: Pick<Device, 'id'>, fromDate: Date, toDate: Date) {
	return drizzleClient
		.select({
			time: deviceToLocation.time,
			x: sql<number>`ST_X(${location.location})`.as('x'),
			y: sql<number>`ST_Y(${location.location})`.as('y'),
		})
		.from(location)
		.innerJoin(deviceToLocation, eq(deviceToLocation.locationId, location.id))
		.where(
			and(
				eq(deviceToLocation.deviceId, id),
				between(deviceToLocation.time, fromDate, toDate)
			)
		)
		.orderBy(desc(deviceToLocation.time));
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

export type DeviceWithoutSensors = Awaited<ReturnType<typeof getDeviceWithoutSensors>>

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
		columns: DEVICE_COLUMNS_WITH_SENSORS,
		with: {
			sensors: true,
		},
	})
}

type DevicesFormat = 'json' | 'geojson'

export async function getDevices(format: 'json'): Promise<Device[]>
export async function getDevices(format: 'geojson'): Promise<GeoJSON.FeatureCollection<Point>>
export async function getDevices(format?: DevicesFormat): Promise<Device[] | GeoJSON.FeatureCollection<Point>>

export async function getDevices(format: DevicesFormat = 'json') {
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

	if (format === 'geojson') {
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

	return devices
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

interface BuildWhereClauseOptions {
	name?: string;
	phenomenon?: string;
	fromDate?: string | Date;
	toDate?: string | Date;
	bbox?: {
	  coordinates: number[][][];
	};
	near?: [number, number]; // [lat, lng]
	maxDistance?: number;
	grouptag?: string[];
	exposure?: string[];
	model?: string[];
  }

  export interface FindDevicesOptions extends BuildWhereClauseOptions {
	minimal?: string | boolean;
	limit?: number;
	format?: "json" | "geojson"
  }

  interface WhereClauseResult {
	includeColumns: Record<string, any>;
	whereClause: any[];
  }

  const buildWhereClause = function buildWhereClause(
	opts: BuildWhereClauseOptions = {}
  ): WhereClauseResult  {
	const { name, phenomenon, fromDate, toDate, bbox, near, maxDistance, grouptag } = opts;
	const clause = [];
	const columns = {};
  
	if (name) {
	  clause.push(ilike(device.name, `%${name}%`));
	}
  
	if (phenomenon) {
	  // @ts-ignore
	  columns['sensors'] = {
	  // @ts-ignore
		where: (sensor, { ilike }) => ilike(sensorTable['title'], `%${phenomenon}%`)
	  };
	}
  
	// simple string parameters
	// for (const param of ['exposure', 'model'] as const) {
	// 	if (opts[param]) {
	// 	  clause.push(inArray(device[param], opts[param]!));
	// 	}
	// }
  
	if (grouptag) {
	  clause.push(arrayContains(device.tags, grouptag));
	}
  
	// https://orm.drizzle.team/learn/guides/postgis-geometry-point
	if (bbox) {
		const [latSW, lngSW] = bbox.coordinates[0][0];
		const [latNE, lngNE] = bbox.coordinates[0][2];
		clause.push(
		  sql`ST_Contains(
			ST_MakeEnvelope(${lngSW}, ${latSW}, ${lngNE}, ${latNE}, 4326),
			ST_SetSRID(ST_MakePoint(${device.longitude}, ${device.latitude}), 4326)
		  )`
		);
	  }
  
	  if (near && maxDistance !== undefined) {
		clause.push(
		  sql`ST_DWithin(
			ST_SetSRID(ST_MakePoint(${device.longitude}, ${device.latitude}), 4326),
			ST_SetSRID(ST_MakePoint(${near[1]}, ${near[0]}), 4326),
			${maxDistance}
		  )`
		);
	  }
  
	  if (phenomenon && (fromDate || toDate)) {
		// @ts-ignore
		columns["sensors"] = {
		  include: {
			measurements: {
			  where: (measurement: any) => {
				const conditions = [];
	
				if (fromDate && toDate) {
				  conditions.push(
					sql`${measurement.createdAt} BETWEEN ${fromDate} AND ${toDate}`
				  );
				} else if (fromDate) {
				  conditions.push(sql`${measurement.createdAt} >= ${fromDate}`);
				} else if (toDate) {
				  conditions.push(sql`${measurement.createdAt} <= ${toDate}`);
				}
	
				return and(...conditions);
			  },
			},
		  },
		};
	  }
  
	return {
	  includeColumns: columns,
	  whereClause: clause
	};
  };

  const MINIMAL_COLUMNS = {
	id: true,
	name: true,
	exposure: true,
	longitude: true,
	latitude: true
  };
  
  const DEFAULT_COLUMNS = {
	id: true,
	name: true,
	model: true,
	exposure: true,
	grouptag: true,
	image: true,
	description: true,
	link: true,
	createdAt: true,
	updatedAt: true,
	longitude: true,
	latitude: true
  };

  export async function findDevices (
	opts: FindDevicesOptions = {},
	columns: Record<string, any> = {},
	relations: Record<string, any> = {}
  ) {
	const { minimal, limit } = opts;
	const { includeColumns, whereClause } = buildWhereClause(opts);
	columns = minimal ? MINIMAL_COLUMNS : { ...DEFAULT_COLUMNS, ...columns };
	relations = {
	  ...relations,
	  ...includeColumns
	};
	const devices = await drizzleClient.query.device.findMany({
	  ...(Object.keys(columns).length !== 0 && { columns }),
	  ...(Object.keys(relations).length !== 0 && { with: relations }),
	  ...(Object.keys(whereClause).length !== 0 && {
		where: (_, { and }) => and(...whereClause)
	  }),
	  limit
	});
  
	return devices;
  };

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
					description: deviceData.description,
					image: deviceData.image,
					link: deviceData.link,
					exposure: deviceData.exposure,
					public: deviceData.public ?? false,
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
			
			// Add sensors in the same transaction and collect them
			const createdSensors = [];
			if (deviceData.sensors && Array.isArray(deviceData.sensors)) {
				for (const sensorData of deviceData.sensors) {
					const [newSensor] = await tx.insert(sensor)
						.values({
							title: sensorData.title,
							unit: sensorData.unit,
							sensorType: sensorData.sensorType,
							deviceId: createdDevice.id, // Reference the created device ID
						})
						.returning();
					
					if (newSensor) {
						createdSensors.push(newSensor);
					}
				}
			}
			
			// Return device with sensors
			return {
				...createdDevice,
				sensors: createdSensors
			};
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

export async function findAccessToken(deviceId: string): Promise<{ token: string } | null> {
	const result = await drizzleClient.query.accessToken.findFirst({
	  where: (token, { eq }) => eq(token.deviceId, deviceId)
	});
  
	if (!result || !result.token) return null;
	
	return { token: result.token };
  }
