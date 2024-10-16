// log-entry.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { device } from "./device";
import {
  relations,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Table definition
export const logEntry = pgTable("log_entry", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  public: boolean("public").default(false).notNull(),
  deviceId: text("device_id").notNull(),
});

// Relations definition
export const logEntryRelations = relations(logEntry, ({ one }) => ({
  device: one(device, {
    fields: [logEntry.deviceId],
    references: [device.id],
  }),
}));

// Type exports
export type LogEntry = InferSelectModel<typeof logEntry>;
export type InsertLogEntry = InferInsertModel<typeof logEntry>;
