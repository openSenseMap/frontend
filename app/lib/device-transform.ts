import { type Device, type Sensor } from '~/db/schema'
import {
	getPublicLocation,
	type LocationDisclosure,
} from '~/lib/geomasking.server'
import { toIsoString } from '~/utils'

export type DeviceWithSensors = Device & {
	sensors?: Sensor[]
}

export type TransformedDevice = {
	_id: string
	name: string
	description: string | null
	image: string | null
	website: string | null
	link: string | null
	grouptag: string[]
	exposure: string | null
	model: string | null
	latitude: number
	longitude: number
	locationPrivacy?: string | null
	locationPrivacyMinDistanceMeters?: number | null
	locationPrivacyRadiusMeters?: number | null
	locationPrivacyMethod?: string | null
	locationDisclosure: LocationDisclosure
	useAuth: boolean | null
	access_token: string | null
	public: boolean | null
	status: string | null
	createdAt: string
	updatedAt: string
	expiresAt: string | null
	userId: string
	sensorWikiModel?: string | null
	currentLocation: {
		type: 'Point'
		coordinates: number[]
		timestamp: string
	}
	lastMeasurementAt: string
	loc: Array<{
		type: 'Feature'
		geometry: {
			type: 'Point'
			coordinates: number[]
			timestamp: string
		}
	}>
	integrations: {
		mqtt: {
			enabled: boolean
		}
	}
	sensors: Array<{
		_id: string
		title: string | null
		unit: string | null
		sensorType: string | null
		lastMeasurement: {
			value: string
			createdAt: string
		} | null
	}>
}

/**
 * Transforms a device with sensors from database format to openSenseMap API format
 * @param box - Device object with sensors from database
 * @returns Transformed device in openSenseMap API format
 *
 * Note: Converts lastMeasurement.value from number to string to match API specification
 */
export function transformDeviceToApiFormat(
	box: DeviceWithSensors,
	options: { includeExactLocation?: boolean } = {},
): TransformedDevice {
	const { id, tags, sensors, apiKey, ...rest } = box
	const timestamp = box.updatedAt.toISOString()
	const publicLocation = options.includeExactLocation
		? {
				latitude: box.latitude,
				longitude: box.longitude,
				disclosure: {
					mode: 'exact' as const,
					accuracyMeters: 0 as const,
					minDistanceMeters: 0 as const,
					maxDistanceMeters: 0 as const,
					method: null,
				},
			}
		: getPublicLocation(box)
	const coordinates = [publicLocation.longitude, publicLocation.latitude]

	return {
		_id: id,
		grouptag: tags || [],
		...rest,
		latitude: publicLocation.latitude,
		longitude: publicLocation.longitude,
		locationDisclosure: publicLocation.disclosure,
		createdAt: toIsoString(box.createdAt)!,
		updatedAt: toIsoString(box.updatedAt)!,
		expiresAt: toIsoString(box.expiresAt),
		currentLocation: {
			type: 'Point',
			coordinates,
			timestamp,
		},
		lastMeasurementAt: timestamp,
		loc: [
			{
				geometry: { type: 'Point', coordinates, timestamp },
				type: 'Feature',
			},
		],
		integrations: { mqtt: { enabled: false } },
		access_token: apiKey,
		sensors:
			sensors?.map((sensor) => ({
				_id: sensor.id,
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				lastMeasurement: sensor.lastMeasurement
					? {
							createdAt: sensor.lastMeasurement.createdAt,
							// Convert number to string to match API specification
							value:
								typeof sensor.lastMeasurement.value === 'number'
									? String(sensor.lastMeasurement.value)
									: sensor.lastMeasurement.value,
						}
					: null,
			})) || [],
	}
}
