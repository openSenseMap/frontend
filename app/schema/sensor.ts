import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, json } from "drizzle-orm/pg-core";
import { DeviceStatusEnum } from "./enum";
import {
  relations,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { device } from "./device";
import type { Measurement } from "./measurement";

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
  sensorType: text("sensor_type"),
  status: DeviceStatusEnum("status").default("inactive"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deviceId: text("device_id")
    .references(() => device.id, {
      onDelete: "cascade",
    })
    .notNull(),
  sensorWikiType: text("sensor_wiki_type"),
  sensorWikiPhenomenon: text("sensor_wiki_phenomenon"),
  sensorWikiUnit: text("sensor_wiki_unit"),
  lastMeasurement: json("lastMeasurement"),
  data: json("data"),
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
export type Sensor = InferSelectModel<typeof sensor>;
export type InsertSensor = InferInsertModel<typeof sensor>;

export type SensorWithLatestMeasurement = Sensor & Measurement;

export type SensorWithMeasurementData = Sensor & {
  data: {
    locationId?: number | null;
    location?: { id: number; x: number; y: number } | null;
    time: Date | null;
    value: number | null;
    sensorId: string | null;
  }[];
};
