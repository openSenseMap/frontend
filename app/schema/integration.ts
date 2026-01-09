import { createId } from '@paralleldrive/cuid2'
import {
	boolean,
	integer,
	json,
	pgTable,
	primaryKey,
	text,
} from 'drizzle-orm/pg-core'
import { MqttMessageFormatEnum, TtnProfileEnum } from './enum'
import { device } from './device'
import { relations, sql } from 'drizzle-orm'

export const mqttIntegration = pgTable('mqtt_integration', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	enabled: boolean('enabled').default(false).notNull(),
	url: text('url').notNull(),
	topic: text('topic').notNull(),
	messageFormat: MqttMessageFormatEnum('message_format')
		.default('json')
		.notNull(),
	decodeOptions: json('decode_options'),
	connectionOptions: json('connection_options'),
	deviceId: text('device_id').references(() => device.id, {
		onDelete: 'cascade',
	}),
})

export const ttnIntegration = pgTable('ttn_integration', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	enabled: boolean('enabled').default(false).notNull(),
	devId: text('dev_id').notNull(),
	appId: text('app_id').notNull(),
	port: integer('port'),
	profile: TtnProfileEnum('profile').default('json').notNull(),
	decodeOptions: json('decode_options')
		.$type<string[]>()
		.default(sql`'{}'::json`),
	deviceId: text('device_id').references(() => device.id, {
		onDelete: 'cascade',
	}),
})

export const deviceToIntegrations = pgTable(
	'device_to_integrations',
	{
		deviceId: text('device_id')
			.notNull()
			.references(() => device.id, { onDelete: 'cascade' }),
		mqttIntegrationId: text('mqtt_integration_id').references(
			() => mqttIntegration.id,
			{
				onDelete: 'set null',
			},
		),
		ttnIntegrationId: text('ttn_integration_id').references(
			() => ttnIntegration.id,
			{
				onDelete: 'set null',
			},
		),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.deviceId] }),
	}),
)

export const deviceToIntegrationsRelations = relations(
	deviceToIntegrations,
	({ one }) => ({
		mqttIntegration: one(mqttIntegration, {
			fields: [deviceToIntegrations.mqttIntegrationId],
			references: [mqttIntegration.id],
		}),
		ttnIntegration: one(ttnIntegration, {
			fields: [deviceToIntegrations.ttnIntegrationId],
			references: [ttnIntegration.id],
		}),
	}),
)
