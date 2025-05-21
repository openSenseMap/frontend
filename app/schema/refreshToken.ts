import { relations, type InferSelectModel } from "drizzle-orm";
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

export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
  user: one(user, {
    fields: [refreshToken.userId],
    references: [user.id]
  })
}));

export type RefreshToken = InferSelectModel<typeof refreshToken>;
