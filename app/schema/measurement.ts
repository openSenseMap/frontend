import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  doublePrecision,
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
    sensorId: text("sensorId").notNull(),
    time: timestamp("time", { precision: 3, withTimezone: true })
      .defaultNow()
      .notNull(),
    value: doublePrecision("value"),
  },
  (t) => ({
    unq: unique().on(t.sensorId, t.time),
  }),
);

/**
 * Relations
 */

/**
 * Views
 */
export const measurements15minView = pgMaterializedView("measurement_15min", {
  sensorId: text("sensorId").notNull(),
  time: timestamp("time", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  value: doublePrecision("value"),
}).as(
  sql`select ${measurement.sensorId}, time_bucket('15 min', ${measurement.time}) AS time, AVG(value) AS value from ${measurement} GROUP BY 1, 2 WITH NO DATA`,
);

export const measurements1dayView = pgMaterializedView("measurement_1day", {
  sensorId: text("sensorId").notNull(),
  time: timestamp("time", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  value: doublePrecision("value"),
}).as(
  sql`select ${measurements15minView.sensorId}, time_bucket('1 day', ${measurements15minView.time}) AS time, AVG(value) AS value from ${measurements15minView} GROUP BY 1, 2 WITH NO DATA`,
)

/**
 * Types
 */
export type Measurement = InferSelectModel<typeof measurement>;
