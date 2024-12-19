import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import moment from "moment";

/**
 * Table
 */
export const tokenBlacklist = pgTable("token_blacklist", {
  hash: text("hash").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at")
    .notNull()
    .$defaultFn(() => moment.utc().add(1, "week").toDate()),
});

/**
 * Types
 */
export type TokenBlacklist = InferSelectModel<typeof tokenBlacklist>;
export type InsertTokenBlacklist = InferInsertModel<typeof tokenBlacklist>;
