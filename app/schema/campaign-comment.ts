import { createId } from "@paralleldrive/cuid2";
import {
  pgTable,
  boolean,
  text,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import {
    relations,
    type InferInsertModel,
    type InferSelectModel,
  } from "drizzle-orm";
import { user } from "./user";

// model Comment {
//     id           String    @id @default(cuid())
//     content      String
//     campaign     Campaign  @relation(fields: [campaignSlug], references: [slug], onDelete: Cascade)
//     campaignSlug String
//     createdAt    DateTime
//     updatedAt    DateTime
//     owner        User      @relation(fields: [ownerId], references: [id], onDelete: Cascade, onUpdate: Cascade)
//     ownerId      String
//     Children     Comment[] @relation("Comment_Children")
//     parent       Comment?  @relation("Comment_Children", fields: [parent_id], references: [id])
//     parent_id    String?
//   }

export const comment = pgTable("comment", {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    content: text("content").notNull(),
    campaignSlug: text("campaignSlug").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id").notNull(),



})

export const commentRelations = relations(comment, ({ one, many }) => ({
    user: one(user, {
        fields: [comment.userId],
        references: [user.id]
    }),
    // campaign: one(campaign, {
    //     fields: [comment.campaignSlug],
    //     references: []
    // } )
})
)


export type Comment = InferSelectModel<typeof comment>;
export type InsertComment = InferInsertModel<typeof comment>;