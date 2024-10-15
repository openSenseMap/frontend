import { relations } from "drizzle-orm";
import { geometry, index, pgTable, serial, unique } from "drizzle-orm/pg-core";
import { measurement } from "./measurement";

/**
 * Table
 */
export const location = pgTable(
  "location",
  {
    id: serial("id").primaryKey(),
    location: geometry("location", {
      type: "point",
      mode: "xy",
      srid: 4326,
    }).notNull(),
  },
  (t) => ({
    locationIndex: index("location_index").using("gist", t.location),
    unique_location: unique().on(t.location),
  }),
);

/**
 * Relations
 * 1. One-to-many: Location - Measurement (One location can have many measurements)
 */
export const locationRelations = relations(location, ({ many }) => ({
  measurements: many(measurement),
}));
