import { pgTable, text } from "drizzle-orm/pg-core";
import { device } from "./device";
import {
  relations,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";

/**
 * Table
 */
export const accessToken = pgTable("access_token", {
  deviceId: text("device_id")
    .notNull()
    .references(() => device.id, {
      onDelete: "cascade",
    }),
  token: text("token"),
});

/**
 * Relations
 */
export const accessTokenRelations = relations(accessToken, ({ one }) => ({
  user: one(device, {
    fields: [accessToken.deviceId],
    references: [device.id],
  }),
}));

/**
 * Types
 */
export type AccessToken = InferSelectModel<typeof accessToken>;
export type InsertAccessToken = InferInsertModel<typeof accessToken>;
