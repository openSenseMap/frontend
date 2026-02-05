import { type InferSelectModel, relations } from 'drizzle-orm'
import { pgTable, text } from 'drizzle-orm/pg-core'
import { device } from './device'

export const deviceApiKey = pgTable('device_api_key', {
	deviceId: text('device_id')
		.notNull()
		.references(() => device.id, {
			onDelete: 'cascade',
		}),
	apiKey: text('api_key'),
})

export const deviceApiKeyRelations = relations(deviceApiKey, ({ one }) => ({
	user: one(device, {
		fields: [deviceApiKey.deviceId],
		references: [device.id],
	}),
}))

export type DeviceApiKey = InferSelectModel<typeof deviceApiKey>
