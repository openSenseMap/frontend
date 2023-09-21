import { createId } from "@paralleldrive/cuid2";
import { pgTable, boolean, text } from "drizzle-orm/pg-core";
import { user } from "./user";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Table
 */
export const profile = pgTable("profile", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  username: text("username").unique().notNull(),
  public: boolean("public").default(false),
  userId: text("user_id").references(() => user.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

/**
 * Types
 */
export type SelectProfile = InferSelectModel<typeof profile>;
export type InsertProfile = InferInsertModel<typeof profile>;
