import { randomBytes } from 'crypto'
import { createId } from '@paralleldrive/cuid2'
import {
	relations,
	type InferInsertModel,
	type InferSelectModel,
} from 'drizzle-orm'
import {
	doublePrecision,
	pgTable,
	text,
	timestamp,
	json,
	integer,
} from 'drizzle-orm/pg-core'
import { device } from './device'
import { DeviceStatusEnum } from './enum'

export function generateHexId(): string {
	return randomBytes(12).toString('hex')
}

export type LastMeasurement = {
	value: number | string | null
	createdAt: string
	sensorId?: string
} | null

/**
 * Table
 */
export const sensor = pgTable('sensor', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => generateHexId()), // store as hex strings to maintain compatibility with the byte protocol
	title: text('title').notNull(),
	unit: text('unit'),
	sensorType: text('sensor_type'),
	icon: text('icon'),
	status: DeviceStatusEnum('status').default('inactive'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deviceId: text('device_id')
		.references(() => device.id, {
			onDelete: 'cascade',
		})
		.notNull(),
	sensorWikiType: text('sensor_wiki_type'),
	sensorWikiPhenomenon: text('sensor_wiki_phenomenon'),
	sensorWikiUnit: text('sensor_wiki_unit'),
	data: json('data'),
	order: integer('order').default(0),
})

export const sensorLastMeasurement = pgTable('sensor_last_measurement', {
	sensorId: text('sensor_id')
		.primaryKey()
		.notNull()
		.references(() => sensor.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	time: timestamp('time', { precision: 3, withTimezone: true }).notNull(),
	value: doublePrecision('value'),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

/**
 * Relations
 */
export const sensorRelations = relations(sensor, ({ one }) => ({
	device: one(device, {
		fields: [sensor.deviceId],
		references: [device.id],
	}),
}))

/**
 * Types
 */
export type Sensor = InferSelectModel<typeof sensor>
export type InsertSensor = InferInsertModel<typeof sensor>
export type SensorLastMeasurement = InferSelectModel<
	typeof sensorLastMeasurement
>
export type InsertSensorLastMeasurement = InferInsertModel<
	typeof sensorLastMeasurement
>

export type SensorWithLatestMeasurement = Sensor & {
	lastMeasurement: LastMeasurement
	lastMeasurements?: NonNullable<LastMeasurement>[]
}

export type SensorWithMeasurementData = Sensor & {
	data: {
		locationId?: number | null
		location?: { id: number; x: number; y: number } | null
		time: Date | null
		value: number | null
		sensorId: string | null
	}[]
}
