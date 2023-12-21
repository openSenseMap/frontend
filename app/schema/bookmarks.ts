import { createId } from "@paralleldrive/cuid2";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./user";
import { device } from "./device";

export const bookmarks = pgTable("bookmark", {
    id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
    userId: text("user_id").notNull().references(() => user.id),
    deviceId: text("device_id").notNull().references(() => device.id)
    
},
(bookmarks) => ({
    uniqueBookmarkIndex: uniqueIndex("bookmarks__user_id_device_id__idx").on(
      bookmarks.userId,
      bookmarks.deviceId
    ),
  })
)

export const bookmarkRelations = relations(bookmarks, ({one, many}) => ({
    user: one(user, {
        fields: [bookmarks.userId],
        references: [user.id]
    }),
}))

export type Bookmark = InferSelectModel<typeof bookmarks>
export type InsertBookmark = InferInsertModel<typeof bookmarks>