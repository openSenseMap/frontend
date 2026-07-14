import { createHmac } from 'node:crypto'
import {
	DEFAULT_LOCATION_PRIVACY_MIN_DISTANCE_METERS,
	DEFAULT_LOCATION_PRIVACY_RADIUS_METERS,
	LOCATION_PRIVACY_METHOD,
} from '~/lib/location'

export type LocationDisclosure =
	| {
			mode: 'exact'
			accuracyMeters: 0
			minDistanceMeters: 0
			maxDistanceMeters: 0
			method: null
	  }
	| {
			mode: 'masked'
			accuracyMeters: number
			minDistanceMeters: number
			maxDistanceMeters: number
			method: typeof LOCATION_PRIVACY_METHOD
	  }

export type PublicLocation = {
	latitude: number
	longitude: number
	disclosure: LocationDisclosure
}

export type LocationPrivacyDevice = {
	id: string
	latitude: number
	longitude: number
	locationPrivacy?: string | null
	locationPrivacyMinDistanceMeters?: number | null
	locationPrivacyRadiusMeters?: number | null
	locationPrivacyMethod?: string | null
}

const EARTH_RADIUS_METERS = 6371008.8

// Derive repeatable pseudo-random values from stable device/privacy inputs.
function randomUnitValues(seed: string) {
	const digest = createHmac(
		'sha256',
		process.env.SESSION_SECRET || 'openSenseMap-location-privacy',
	)
		.update(seed)
		.digest()

	const first = digest.readUInt32BE(0) / 0xffffffff
	const second = digest.readUInt32BE(4) / 0xffffffff

	return [first, second] as const
}

// Move a latitude/longitude by a distance and bearing on a spherical earth.
function destinationPoint(
	latitude: number,
	longitude: number,
	distanceMeters: number,
	bearingRadians: number,
) {
	const angularDistance = distanceMeters / EARTH_RADIUS_METERS
	const latitudeRadians = (latitude * Math.PI) / 180
	const longitudeRadians = (longitude * Math.PI) / 180

	const destinationLatitude = Math.asin(
		Math.sin(latitudeRadians) * Math.cos(angularDistance) +
			Math.cos(latitudeRadians) *
				Math.sin(angularDistance) *
				Math.cos(bearingRadians),
	)

	const destinationLongitude =
		longitudeRadians +
		Math.atan2(
			Math.sin(bearingRadians) *
				Math.sin(angularDistance) *
				Math.cos(latitudeRadians),
			Math.cos(angularDistance) -
				Math.sin(latitudeRadians) * Math.sin(destinationLatitude),
		)

	return {
		// Six decimals are roughly decimeter precision, enough to keep output
		// stable while avoiding noisy floating point tails.
		latitude: Number(((destinationLatitude * 180) / Math.PI).toFixed(6)),
		longitude: Number(
			// Normalize longitude back into the conventional [-180, 180) range.
			((((destinationLongitude * 180) / Math.PI + 540) % 360) - 180).toFixed(6),
		),
	}
}

export function getPublicLocation(
	device: LocationPrivacyDevice,
): PublicLocation {
	if (device.locationPrivacy !== 'masked') {
		return {
			latitude: device.latitude,
			longitude: device.longitude,
			disclosure: {
				mode: 'exact',
				accuracyMeters: 0,
				minDistanceMeters: 0,
				maxDistanceMeters: 0,
				method: null,
			},
		}
	}

	const maxDistanceMeters =
		device.locationPrivacyRadiusMeters ?? DEFAULT_LOCATION_PRIVACY_RADIUS_METERS
	const configuredMinDistanceMeters =
		device.locationPrivacyMinDistanceMeters ??
		DEFAULT_LOCATION_PRIVACY_MIN_DISTANCE_METERS
	const minDistanceMeters =
		configuredMinDistanceMeters < maxDistanceMeters
			? configuredMinDistanceMeters
			: Math.max(0, maxDistanceMeters / 5)
	const method = LOCATION_PRIVACY_METHOD
	const seedLatitude = device.latitude.toFixed(6)
	const seedLongitude = device.longitude.toFixed(6)
	// Include rounded exact coordinates in the HMAC seed so moving a device also
	// rotates the donut offset. This prevents observers from comparing old and new
	// public points to recover the exact movement vector.
	const [distanceUnit, bearingUnit] = randomUnitValues(
		`${method}:${device.id}:${seedLatitude}:${seedLongitude}:${minDistanceMeters}:${maxDistanceMeters}`,
	)
	// Pick a distance uniformly by ring area, not by radius. Without the square
	// root, points would be overrepresented near the inner edge of the donut.
	const distanceMeters = Math.sqrt(
		minDistanceMeters ** 2 +
			distanceUnit * (maxDistanceMeters ** 2 - minDistanceMeters ** 2),
	)
	const masked = destinationPoint(
		device.latitude,
		device.longitude,
		distanceMeters,
		2 * Math.PI * bearingUnit,
	)

	return {
		...masked,
		disclosure: {
			mode: 'masked',
			accuracyMeters: maxDistanceMeters,
			minDistanceMeters,
			maxDistanceMeters,
			method,
		},
	}
}
