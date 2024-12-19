import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";
import {
  relations,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";

/**
 * Table
 */
export const refreshToken = pgTable("refresh_token", {
  userId: text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
  token: text("token"),
  expiresAt: timestamp("expires_at"),
});

/**
 * Relations
 */
export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
  user: one(user, {
    fields: [refreshToken.userId],
    references: [user.id],
  }),
}));

/**
 * Types
 */
export type RefreshToken = InferSelectModel<typeof refreshToken>;
export type InsertRefreshToken = InferInsertModel<typeof refreshToken>;
