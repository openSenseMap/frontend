import { createId } from "@paralleldrive/cuid2";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { pgTable, boolean, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { password } from "./password";
import { profile } from "./profile";
import { device } from "./device";
import { campaign } from "./campaign";
import { comment, post } from "./campaign-comment";

/**
 * Table
 */
export const user = pgTable("user", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  role: text("role").$type<"admin" | "user">().default("user"),
  language: text("language").default("en_US"),
  emailIsConfirmed: boolean("emailIsConfirmed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Relations
 */
export const userRelations = relations(user, ({ one, many }) => ({
  password: one(password, {
    fields: [user.id],
    references: [password.userId],
  }),
  profile: one(profile, {
    fields: [user.id],
    references: [profile.userId],
  }),
  devices: many(device),
  campaigns: many(campaign),
  participating: many(usersToCampaigns),
  campaignBookmarks: many(bookmarkedCampaigns),
  comment: many(comment),
  post: many(post)
}));


export const usersToCampaigns = pgTable('users_to_campaigns', {
  userId: text('user_id').notNull().references(() => user.id),
  campaignId: text('campaign_id').notNull().references(() => campaign.id),
}, (t) => ({
  pk: primaryKey({columns: [t.userId, t.campaignId]}),
}),
);

export const usersToCampaignsRelations = relations(usersToCampaigns, ({ one }) => ({
  campaign: one(campaign, {
    fields: [usersToCampaigns.campaignId],
    references: [campaign.id],
  }),
  user: one(user, {
    fields: [usersToCampaigns.userId],
    references: [user.id],
  }),
}));

export const bookmarkedCampaigns = pgTable('bookmarkedCampaigns', {
  userId: text('user_id').notNull().references(() => user.id),
  campaignId: text('campaign_id').notNull().references(() => campaign.id),
}, (t) => ({
  pk: primaryKey({columns: [t.userId, t.campaignId]}),
}),
);

export const bookmarkedCampaignsRelations = relations(bookmarkedCampaigns, ({ one }) => ({
  campaign: one(campaign, {
    fields: [bookmarkedCampaigns.campaignId],
    references: [campaign.id],
  }),
  user: one(user, {
    fields: [bookmarkedCampaigns.userId],
    references: [user.id],
  }),
}));


/**
 * Types
 */
export type User = InferSelectModel<typeof user>;
export type InsertUser = InferInsertModel<typeof user>;