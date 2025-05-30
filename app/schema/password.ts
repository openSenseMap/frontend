import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";
import { user } from "./user";

const ONE_HOUR_MILLIS: number = 60 * 60 * 1000;

/**
 * Table
 */
export const password = pgTable("password", {
  hash: text("hash").notNull(),
  userId: text("user_id")
    .references(() => user.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
});

export const passwordResetRequest = pgTable("password_reset_request", {
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
    .$defaultFn(
      () => new Date(Date.now() + 12 * ONE_HOUR_MILLIS), // 12 hours from now
    ),
});

/**
 * Types
 */
export type Password = InferSelectModel<typeof password>;
export type InsertPassword = InferInsertModel<typeof password>;
export type PasswordResetRequest = InferSelectModel<
  typeof passwordResetRequest
>;
export type InsertPasswordResetRequest = InferInsertModel<
  typeof passwordResetRequest
>;
