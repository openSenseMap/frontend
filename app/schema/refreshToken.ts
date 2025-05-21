import { type InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const refreshToken = pgTable("refresh_token", {
  userId: text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
  token: text("token"),
  expiresAt: timestamp("expires_at"),
});

export type RefreshToken = InferSelectModel<typeof refreshToken>;
