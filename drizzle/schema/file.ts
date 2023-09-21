import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { bytea } from "./types";

/**
 * Table
 */
export const file = pgTable("file", {
  id: text("id")
    .unique()
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  blob: bytea("blob"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
