import { createId } from "@paralleldrive/cuid2";
import {
  pgTable,
  boolean,
  text,
  timestamp,
  doublePrecision,
  varchar,
} from "drizzle-orm/pg-core";
import {
    relations,
    type InferInsertModel,
    type InferSelectModel,
  } from "drizzle-orm";
import { user } from "./user";
import { campaign } from "./campaign";

export const post = pgTable("post", {
  id: text("id").primaryKey().notNull()
  .$defaultFn(() => createId()),
  userId: text("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  campaignSlug: text("campaignSlug").notNull()
});

export type Post = InferSelectModel<typeof post>
export type InsertPost = InferInsertModel<typeof post>

export const postRelations = relations(post, ({ many, one }) => ({
  comment: many(comment),
  author: one(user, {
    fields: [post.userId],
    references: [user.id],
  }),
  campaign: one(campaign, {
    fields: [post.campaignSlug],
    references: [campaign.slug]
  })
}));

export const comment = pgTable("comment", {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    postId: text("post_id"),
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
    campaign: one(campaign, {
        fields: [comment.campaignSlug],
        references: [campaign.slug]
    } ),
    post: one(post, {
      fields: [comment.postId],
      references: [post.id]
    })
})
)


export type Comment = InferSelectModel<typeof comment>;
export type InsertComment = InferInsertModel<typeof comment>;