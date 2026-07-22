import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
	user: {
		password: r.one.password({
			from: r.user.id,
			to: r.password.userId,
			optional: false,
		}),
		profile: r.one.profile({
			from: r.user.id,
			to: r.profile.userId,
		}),
		devices: r.many.device(),
		refreshToken: r.many.refreshToken(),
		actionTokens: r.many.actionToken(),
	},
	device: {
		user: r.one.user({
			from: r.device.userId,
			to: r.user.id,
			optional: false,
		}),
		sensors: r.many.sensor(),
		locations: r.many.deviceToLocation(),
		geometries: r.many.location({
			from: r.device.id.through(r.deviceToLocation.deviceId),
			to: r.location.id.through(r.deviceToLocation.locationId),
		}),
		logEntries: r.many.logEntry(),
	},
	deviceToLocation: {
		device: r.one.device({
			from: r.deviceToLocation.deviceId,
			to: r.device.id,
			optional: false,
		}),
		geometry: r.one.location({
			from: r.deviceToLocation.locationId,
			to: r.location.id,
			optional: false,
		}),
	},
	sensor: {
		device: r.one.device({
			from: r.sensor.deviceId,
			to: r.device.id,
			optional: false,
		}),
		measurements: r.many.measurement({
			from: r.sensor.id,
			to: r.measurement.sensorId,
		}),
	},
	measurement: {
		sensor: r.one.sensor({
			from: r.measurement.sensorId,
			to: r.sensor.id,
			optional: false,
		}),
		location: r.one.location({
			from: r.measurement.locationId,
			to: r.location.id,
		}),
	},
	location: {
		measurements: r.many.measurement(),
		devices: r.many.device(),
	},
	profile: {
		user: r.one.user({
			from: r.profile.userId,
			to: r.user.id,
			optional: false,
		}),
		profileImage: r.one.profileImage({
			from: r.profile.id,
			to: r.profileImage.profileId,
		}),
	},
	actionToken: {
		user: r.one.user({
			from: r.actionToken.userId,
			to: r.user.id,
			optional: false,
		}),
	},
	refreshToken: {
		user: r.one.user({
			from: r.refreshToken.userId,
			to: r.user.id,
			optional: false,
		}),
	},
	logEntry: {
		device: r.one.device({
			from: r.logEntry.deviceId,
			to: r.device.id,
			optional: false,
		}),
	},
}))
