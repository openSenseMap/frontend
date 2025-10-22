import { pgTable, text } from "drizzle-orm/pg-core";
import { device } from "./device";
import { InferSelectModel, relations } from "drizzle-orm";

export const accessToken = pgTable('access_token', {
    deviceId: text('device_id').notNull()
      .references(() => device.id, {
        onDelete: 'cascade'
      }),
    token: text('token'),
  });

 export const accessTokenRelations = relations(accessToken, ({ one }) => ({
    user: one(device, {
      fields: [accessToken.deviceId],
      references: [device.id]
    })
  }));  

export type AccessToken = InferSelectModel<typeof accessToken>;
