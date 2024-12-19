import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";

/**
 * Table
 */
const passwordReset = pgTable("password_reset", {
  userId: text("user_id")
    .unique()
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
  token: text("token")
    .notNull()
    .$defaultFn(() => uuidv4()),
  expiresAt: timestamp("expires_at")
    .notNull()
    .$defaultFn(() => moment.utc().add(12, "hours").toDate()),
});

/**
 * Types
 */
export type PasswordReset = InferSelectModel<typeof passwordReset>;
export type InsertPasswordReset = InferInsertModel<typeof passwordReset>;
