// log-entry.ts
import { createId } from '@paralleldrive/cuid2'
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm'
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

// Table definition
export const logEntry = pgTable('log_entry', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$defaultFn(() => createId()),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	public: boolean('public').default(false).notNull(),
	deviceId: text('device_id').notNull(),
})

// Type exports
export type LogEntry = InferSelectModel<typeof logEntry>
export type InsertLogEntry = InferInsertModel<typeof logEntry>
