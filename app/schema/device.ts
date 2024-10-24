import { createId } from "@paralleldrive/cuid2";
import {
  pgTable,
  boolean,
  text,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { DeviceExposureEnum, DeviceModelEnum, DeviceStatusEnum } from "./enum";
import {
  relations,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { user } from "./user";
import { sensor } from "./sensor";
import { logEntry } from "./log-entry";

/**
 * Table
 */
export const device = pgTable("device", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  image: text("image"),
  description: text("description"),
  tags: text("tags")
    .array()
    .default(sql`ARRAY[]::text[]`),
  link: text("link"),
  useAuth: boolean("use_auth"),
  exposure: DeviceExposureEnum("exposure"),
  status: DeviceStatusEnum("status").default("inactive"),
  model: DeviceModelEnum("model"),
  public: boolean("public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  userId: text("user_id").notNull(),
  sensorWikiModel: text("sensor_wiki_model"),
});

/**
 * Relations
 */
export const deviceRelations = relations(device, ({ one, many }) => ({
  user: one(user, {
    fields: [device.userId],
    references: [user.id],
  }),
  sensors: many(sensor),
  logEntries: many(logEntry),
}));

/**
 * Types
 */
export type Device = InferSelectModel<typeof device>;
export type InsertDevice = InferInsertModel<typeof device>;
