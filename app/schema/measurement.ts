import type { InferSelectModel } from "drizzle-orm";
import {
  doublePrecision,
  geometry,
  index,
  integer,
  pgMaterializedView,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Table
 */
export const measurement = pgTable(
  "measurement",
  {
    sensorId: text("sensor_id").notNull(),
    time: timestamp("time", { precision: 3, withTimezone: true })
      .defaultNow()
      .notNull(),
    value: doublePrecision("value"),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
  },
  (t) => ({
    unq: unique().on(t.sensorId, t.time),
    spatialIndex: index("measurement_location_index").using("gist", t.location),
  }),
);

/**
 * Relations
 */

/**
 * Views
 */
export const measurements10minView = pgMaterializedView("measurement_10min", {
  sensorId: text("sensor_id"),
  time: timestamp("time", { precision: 3, withTimezone: true }),
  value: doublePrecision("avg_value"),
  total_values: integer("total_values"),
  min_value: doublePrecision("min_value"),
  max_value: doublePrecision("max_value"),
}).existing();

export const measurements1hourView = pgMaterializedView("measurement_1hour", {
  sensorId: text("sensor_id"),
  time: timestamp("time", { precision: 3, withTimezone: true }),
  value: doublePrecision("avg_value"),
  total_values: integer("total_values"),
  min_value: doublePrecision("min_value"),
  max_value: doublePrecision("max_value"),
}).existing();

export const measurements1dayView = pgMaterializedView("measurement_1day", {
  sensorId: text("sensor_id"),
  time: timestamp("time", { precision: 3, withTimezone: true }),
  value: doublePrecision("avg_value"),
  total_values: integer("total_values"),
  min_value: doublePrecision("min_value"),
  max_value: doublePrecision("max_value"),
}).existing();

export const measurements1monthView = pgMaterializedView("measurement_1month", {
  sensorId: text("sensor_id"),
  time: timestamp("time", { precision: 3, withTimezone: true }),
  value: doublePrecision("avg_value"),
  total_values: integer("total_values"),
  min_value: doublePrecision("min_value"),
  max_value: doublePrecision("max_value"),
}).existing();

export const measurements1yearView = pgMaterializedView("measurement_1year", {
  sensorId: text("sensor_id"),
  time: timestamp("time", { precision: 3, withTimezone: true }),
  value: doublePrecision("avg_value"),
  total_values: integer("total_values"),
  min_value: doublePrecision("min_value"),
  max_value: doublePrecision("max_value"),
}).existing();

/**
 * Types
 */
export type Measurement = InferSelectModel<typeof measurement>;
