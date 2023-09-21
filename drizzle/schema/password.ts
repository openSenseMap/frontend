import { pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./user";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Table
 */
export const password = pgTable("password", {
  hash: text("hash").notNull(),
  userId: text("user_id").references(() => user.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

/**
 * Types
 */
export type SelectPassword = InferSelectModel<typeof password>;
export type InsertPassword = InferInsertModel<typeof password>;
