import { point } from '@turf/helpers'
import { eq, sql, desc, ilike, arrayContains, and, between } from 'drizzle-orm'
import BaseNewDeviceEmail, {
	messages as BaseNewDeviceMessages,
} from 'emails/base-new-device'
import { messages as NewLufdatenDeviceMessages } from 'emails/new-device-luftdaten'
import { messages as NewSenseboxDeviceMessages } from 'emails/new-device-sensebox'
import { type Point } from 'geojson'
import { drizzleClient } from '~/db.server'
import { sendMail } from '~/lib/mail.server'
import {
	device,
	deviceToLocation,
	location,
	sensor,
	user,
	type Device,
	type Sensor,
} from '~/schema'
import { getSensorsForModel } from '~/utils/model-definitions'

const BASE_DEVICE_COLUMNS = {
	id: true,
	name: true,
	description: true,
	image: true,
	website: true,
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
} as const

const DEVICE_COLUMNS_WITH_SENSORS = {
	...BASE_DEVICE_COLUMNS,
	useAuth: true,
	public: true,
	userId: true,
} as const

export class DeviceUpdateError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400,
	) {
		super(message)
		this.name = 'DeviceUpdateError'
	}
}

export function getDevice({ id }: Pick<Device, 'id'>) {
	return drizzleClient.query.device.findFirst({
		where: (device, { eq }) => eq(device.id, id),
		columns: BASE_DEVICE_COLUMNS,
		with: {
			user: {
				columns: {
					id: true,
				},
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
			sensors: true,
		},
	})
}

export function getLocations(
	{ id }: Pick<Device, 'id'>,
	fromDate: Date,
	toDate: Date,
) {
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
				between(deviceToLocation.time, fromDate, toDate),
			),
		)
		.orderBy(desc(deviceToLocation.time))
}
export function getDeviceWithoutSensors({ id }: Pick<Device, 'id'>) {
	return drizzleClient.query.device.findFirst({
		where: (device, { eq }) => eq(device.id, id),
		columns: {
			id: true,
			name: true,
			description: true,
			exposure: true,
			image: true,
			tags: true,
			website: true,
			updatedAt: true,
			latitude: true,
			longitude: true,
		},
	})
}

export type DeviceWithoutSensors = Awaited<
	ReturnType<typeof getDeviceWithoutSensors>
>

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

export type UpdateDeviceArgs = {
	name?: string
	exposure?: string
	grouptag?: string | string[]
	description?: string
	website?: string
	link?: string
	image?: string
	model?: string
	useAuth?: boolean
	location?: { lat: number; lng: number; height?: number }
	sensors?: SensorUpdateArgs[]
}

type SensorUpdateArgs = {
	_id?: string
	title?: string
	unit?: string
	sensorType?: string
	icon?: string
	deleted?: any
	edited?: any
	new?: any
}

export async function updateDevice(
	deviceId: string,
	args: UpdateDeviceArgs,
): Promise<Device> {
	const setColumns: Record<string, any> = {}
	const updatableFields: (keyof UpdateDeviceArgs)[] = [
		'name',
		'exposure',
		'description',
		'website',
		'image',
		'model',
		'useAuth',
		'link',
	]

	for (const field of updatableFields) {
		if (args[field] !== undefined) {
			// Handle empty string -> null for specific fields (backwards compatibility)
			if (
				(field === 'description' || field === 'link' || field === 'image') &&
				args[field] === ''
			) {
				setColumns[field] = null
			} else {
				setColumns[field] = args[field]
			}
		}
	}

	if ('grouptag' in args) {
		if (Array.isArray(args.grouptag)) {
			// Empty array -> null for backwards compatibility
			setColumns['tags'] = args.grouptag.length === 0 ? null : args.grouptag
		} else if (args.grouptag != null) {
			// Empty string -> null
			setColumns['tags'] = args.grouptag === '' ? null : [args.grouptag]
		} else {
			setColumns['tags'] = null
		}
	}

	const result = await drizzleClient.transaction(async (tx) => {
		if (args.location) {
			const { lat, lng, height } = args.location

			const pointWKT = `POINT(${lng} ${lat})`

			const [existingLocation] = await tx
				.select()
				.from(location)
				.where(sql`ST_Equals(location, ST_GeomFromText(${pointWKT}, 4326))`)
				.limit(1)

			let locationId: bigint

			if (existingLocation) {
				locationId = existingLocation.id
			} else {
				const [newLocation] = await tx
					.insert(location)
					.values({
						location: sql`ST_GeomFromText(${pointWKT}, 4326)`,
					})
					.returning()

				if (!newLocation) {
					throw new Error('Failed to create location')
				}

				locationId = newLocation.id
			}

			await tx
				.insert(deviceToLocation)
				.values({
					deviceId,
					locationId,
					time: sql`NOW()`,
				})
				.onConflictDoNothing()

			setColumns['latitude'] = lat
			setColumns['longitude'] = lng
		}

		let updatedDevice
		if (Object.keys(setColumns).length > 0) {
			;[updatedDevice] = await tx
				.update(device)
				.set({ ...setColumns, updatedAt: sql`NOW()` })
				.where(eq(device.id, deviceId))
				.returning()

			if (!updatedDevice) {
				throw new DeviceUpdateError(`Device ${deviceId} not found`, 404)
			}
		} else {
			;[updatedDevice] = await tx
				.select()
				.from(device)
				.where(eq(device.id, deviceId))

			if (!updatedDevice) {
				throw new DeviceUpdateError(`Device ${deviceId} not found`, 404)
			}
		}

		if (args.sensors?.length) {
			const existingSensors = await tx
				.select()
				.from(sensor)
				.where(eq(sensor.deviceId, deviceId))

			const sensorsToDelete = args.sensors.filter(
				(s) => 'deleted' in s && s._id,
			)
			const remainingSensorCount =
				existingSensors.length - sensorsToDelete.length

			if (sensorsToDelete.length > 0 && remainingSensorCount < 1) {
				throw new DeviceUpdateError(
					'Unable to delete sensor(s). A box needs at least one sensor.',
				)
			}

			for (const s of args.sensors) {
				const hasDeleted = 'deleted' in s
				const hasEdited = 'edited' in s
				const hasNew = 'new' in s

				if (!hasDeleted && !hasEdited && !hasNew) {
					continue
				}

				if (hasDeleted) {
					if (!s._id) {
						throw new DeviceUpdateError('Sensor deletion requires _id')
					}

					const sensorExists = existingSensors.some(
						(existing) => existing.id === s._id,
					)

					if (!sensorExists) {
						throw new DeviceUpdateError(
							`Sensor with id ${s._id} not found for deletion.`,
						)
					}

					await tx.delete(sensor).where(eq(sensor.id, s._id))
				} else if (hasEdited && hasNew) {
					if (!s.title || !s.unit || !s.sensorType) {
						throw new DeviceUpdateError(
							'New sensor requires title, unit, and sensorType',
						)
					}

					await tx.insert(sensor).values({
						title: s.title,
						unit: s.unit,
						sensorType: s.sensorType,
						icon: s.icon,
						deviceId,
					})
				} else if (hasEdited && s._id) {
					const sensorExists = existingSensors.some(
						(existing) => existing.id === s._id,
					)

					if (!sensorExists) {
						throw new DeviceUpdateError(
							`Sensor with id ${s._id} not found for editing.`,
						)
					}

					if (!s.title || !s.unit || !s.sensorType) {
						throw new DeviceUpdateError(
							'Editing sensor requires all properties: _id, title, unit, sensorType, icon',
						)
					}

					await tx
						.update(sensor)
						.set({
							title: s.title,
							unit: s.unit,
							sensorType: s.sensorType,
							icon: s.icon,
							updatedAt: sql`NOW()`,
						})
						.where(eq(sensor.id, s._id))
				}
			}
		}
		return updatedDevice
	})

	return result
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
export async function getDevices(
	format: 'geojson',
): Promise<GeoJSON.FeatureCollection<Point>>
export async function getDevices(
	format?: DevicesFormat,
): Promise<Device[] | GeoJSON.FeatureCollection<Point>>

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
	name?: string
	phenomenon?: string
	fromDate?: string | Date
	toDate?: string | Date
	bbox?: {
		coordinates: (number | undefined)[][][]
	}
	near?: [number, number] // [lat, lng]
	maxDistance?: number
	grouptag?: string[]
	exposure?: string[]
	model?: string[]
}

export interface FindDevicesOptions extends BuildWhereClauseOptions {
	minimal?: string | boolean
	limit?: number
	format?: 'json' | 'geojson'
}

interface WhereClauseResult {
	includeColumns: Record<string, any>
	whereClause: any[]
}

const buildWhereClause = function buildWhereClause(
	opts: BuildWhereClauseOptions = {},
): WhereClauseResult {
	const {
		name,
		phenomenon,
		fromDate,
		toDate,
		bbox,
		near,
		maxDistance,
		grouptag,
	} = opts
	const clause = []
	const columns = {}

	if (name) {
		clause.push(ilike(device.name, `%${name}%`))
	}

	if (phenomenon) {
		// @ts-ignore
		columns['sensors'] = {
			// @ts-ignore
			where: (sensor, { ilike }) =>
				// @ts-ignore
				ilike(sensorTable['title'], `%${phenomenon}%`),
		}
	}

	// simple string parameters
	// for (const param of ['exposure', 'model'] as const) {
	// 	if (opts[param]) {
	// 	  clause.push(inArray(device[param], opts[param]!));
	// 	}
	// }

	if (grouptag) {
		clause.push(arrayContains(device.tags, grouptag))
	}

	// https://orm.drizzle.team/learn/guides/postgis-geometry-point
	if (bbox && bbox.coordinates[0]) {
		const [latSW, lngSW] = bbox.coordinates[0][0]
		const [latNE, lngNE] = bbox.coordinates[0][2]
		clause.push(
			sql`ST_Contains(
			ST_MakeEnvelope(${lngSW}, ${latSW}, ${lngNE}, ${latNE}, 4326),
			ST_SetSRID(ST_MakePoint(${device.longitude}, ${device.latitude}), 4326)
		  )`,
		)
	}

	if (near && maxDistance !== undefined) {
		clause.push(
			sql`ST_DWithin(
			ST_SetSRID(ST_MakePoint(${device.longitude}, ${device.latitude}), 4326),
			ST_SetSRID(ST_MakePoint(${near[1]}, ${near[0]}), 4326),
			${maxDistance}
		  )`,
		)
	}

	if (phenomenon && (fromDate || toDate)) {
		// @ts-ignore
		columns['sensors'] = {
			include: {
				measurements: {
					where: (measurement: any) => {
						const conditions = []

						if (fromDate && toDate) {
							conditions.push(
								sql`${measurement.createdAt} BETWEEN ${fromDate} AND ${toDate}`,
							)
						} else if (fromDate) {
							conditions.push(sql`${measurement.createdAt} >= ${fromDate}`)
						} else if (toDate) {
							conditions.push(sql`${measurement.createdAt} <= ${toDate}`)
						}

						return and(...conditions)
					},
				},
			},
		}
	}

	return {
		includeColumns: columns,
		whereClause: clause,
	}
}

const MINIMAL_COLUMNS = {
	id: true,
	name: true,
	exposure: true,
	longitude: true,
	latitude: true,
}

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
	latitude: true,
}

export async function findDevices(
	opts: FindDevicesOptions = {},
	columns: Record<string, any> = {},
	relations: Record<string, any> = {},
) {
	const { minimal, limit } = opts
	const { includeColumns, whereClause } = buildWhereClause(opts)
	columns = minimal ? MINIMAL_COLUMNS : { ...DEFAULT_COLUMNS, ...columns }
	relations = {
		...relations,
		...includeColumns,
	}
	const devices = await drizzleClient.query.device.findMany({
		...(Object.keys(columns).length !== 0 && { columns }),
		...(Object.keys(relations).length !== 0 && { with: relations }),
		...(Object.keys(whereClause).length !== 0 && {
			where: (_, { and }) => and(...whereClause),
		}),
		limit,
	})

	return devices
}

export async function createDevice(deviceData: any, userId: string) {
	try {
		const [newDevice, usr] = await drizzleClient.transaction(async (tx) => {
			// Get the user info
			const [u] = await tx
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.limit(1)

			// Determine sensors to use
			let sensorsToAdd = deviceData.sensors

			// If model and sensors are both specified, reject (backwards compatibility)
			if (
				deviceData.model &&
				deviceData.sensors &&
				deviceData.model.toLowerCase() !== 'custom'
			) {
				throw new Error(
					'Parameters model and sensors cannot be specified at the same time.',
				)
			}

			// If model is specified but sensors are not, get sensors from model layout
			if (deviceData.model && !deviceData.sensors) {
				const modelSensors = getSensorsForModel(deviceData.model as any)


				if (
					Array.isArray(deviceData.sensorTemplates) &&
					deviceData.sensorTemplates.length > 0
				) {
					sensorsToAdd = modelSensors.filter(sensor =>
					deviceData.sensorTemplates.includes(
						sensor.sensorType.toLowerCase()
					)
					)
				} else {
					sensorsToAdd = modelSensors
				}
				}


			if (deviceData.model?.toLowerCase() === 'custom' && deviceData.sensors) {
				sensorsToAdd = deviceData.sensors ?? []
			}

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
			const createdSensors = []
			if (
				sensorsToAdd &&
				Array.isArray(sensorsToAdd) &&
				sensorsToAdd.length > 0
			) {
				for (const sensorData of sensorsToAdd) {
					const [newSensor] = await tx
						.insert(sensor)
						.values({
							title: sensorData.title,
							unit: sensorData.unit,
							sensorType: sensorData.sensorType,
							icon: sensorData.icon,
							deviceId: createdDevice.id,
						})
						.returning()

					if (newSensor) {
						createdSensors.push(newSensor)
					}
				}
			}

			// Return device with sensors
			return [
				{
					...createdDevice,
					sensors: createdSensors,
				},
				u,
			]
		})

		const lng = (usr.language?.split('_')[0] as 'de' | 'en') ?? 'en'
		switch (newDevice.model) {
			case 'luftdaten.info':
			case 'luftdaten_sds011':
			case 'luftdaten_sds011_bme280':
			case 'luftdaten_sds011_bmp180':
			case 'luftdaten_sds011_dht11':
			case 'luftdaten_sds011_dht22':
				await sendMail({
					recipientAddress: usr.email,
					recipientName: usr.name,
					subject: NewLufdatenDeviceMessages[lng].heading,
					body: BaseNewDeviceEmail({
						user: { name: usr.name },
						device: newDevice,
						language: lng,
						content: NewLufdatenDeviceMessages,
					}),
				})
				break
			case 'homeV2Ethernet':
			case 'homeV2Lora':
			case 'homeV2Wifi':
			case 'homeEthernet':
			case 'homeEthernetFeinstaub':
			case 'homeWifi':
			case 'homeWifiFeinstaub':
			case 'senseBox:Edu':
				await sendMail({
					recipientAddress: usr.email,
					recipientName: usr.name,
					subject: NewSenseboxDeviceMessages[lng].heading,
					body: BaseNewDeviceEmail({
						user: { name: usr.name },
						device: newDevice,
						language: lng,
						content: NewSenseboxDeviceMessages,
					}),
				})
				break
			default:
				await sendMail({
					recipientAddress: usr.email,
					recipientName: usr.name,
					subject: BaseNewDeviceMessages[lng].heading,
					body: BaseNewDeviceEmail({
						user: { name: usr.name },
						device: newDevice,
						language: lng,
						content: BaseNewDeviceMessages,
					}),
				})
				break
		}

		return newDevice
	} catch (error) {
		console.error('Error creating device with sensors:', error)
		throw new Error(
			`Failed to create device and its sensors: ${error instanceof Error ? error.message : String(error)}`,
		)
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

export async function findAccessToken(
	deviceId: string,
): Promise<{ token: string } | null> {
	const result = await drizzleClient.query.accessToken.findFirst({
		where: (token, { eq }) => eq(token.deviceId, deviceId),
	})

	if (!result || !result.token) return null

	return { token: result.token }
}
