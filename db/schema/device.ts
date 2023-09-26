import { createId } from "@paralleldrive/cuid2";
import {
  pgTable,
  boolean,
  text,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { exposureEnum, statusEnum } from "./enum";
import {
  relations,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { user } from "./user";
import { sensor } from "./sensor";

/**
 * Table
 */
export const device = pgTable("device", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  name: text("name"),
  description: text("description"),
  useAuth: boolean("useAuth"),
  exposure: exposureEnum("exposure"),
  status: statusEnum("status").default("inactive"),
  public: boolean("public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  userId: text("user_id").notNull(),
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
}));

/**
 * Types
 */
export type SelectDevice = InferSelectModel<typeof device>;
export type InsertDevice = InferInsertModel<typeof device>;
