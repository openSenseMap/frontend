import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { statusEnum } from "./enum";
import {
  relations,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { device } from "./device";

/**
 * Table
 */
export const sensor = pgTable("sensor", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  title: text("title"),
  unit: text("unit"),
  sensorType: text("sensorType"),
  status: statusEnum("status").default("inactive"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deviceId: text("device_id").notNull(),
});

/**
 * Relations
 */
export const sensorRelations = relations(sensor, ({ one }) => ({
  device: one(device, {
    fields: [sensor.deviceId],
    references: [device.id],
  }),
}));

/**
 * Types
 */
export type SelectSensor = InferSelectModel<typeof sensor>;
export type InsertSensor = InferInsertModel<typeof sensor>;
