import { createId } from "@paralleldrive/cuid2";
import {
  pgTable,
  boolean,
  text,
  timestamp,
  doublePrecision,
  integer,
} from "drizzle-orm/pg-core";
import {
    relations,
    type InferInsertModel,
    type InferSelectModel,
  } from "drizzle-orm";
import { bookmarkedCampaigns, user, usersToCampaigns } from "./user";
import { comment, post } from "./campaign-comment";
import { json } from "drizzle-orm/pg-core";
import { exposureEnum, priorityEnum } from "./enum";
// model Campaign {
//     id                  String             @id @default(uuid())
//     title               String
//     slug                String             @unique
//     feature             Json
//     owner               User               @relation("OwnedCampaigns", fields: [ownerId], references: [id], onDelete: Cascade, onUpdate: Cascade)
//     ownerId             String
//     instructions        String?            @db.VarChar(10000)
//     description         String
//     priority            Priority
//     countries           String[]
//     participants        User[]             @relation("CampaignParticipant")
//     minimumParticipants Int?
//     createdAt           DateTime
//     updatedAt           DateTime
//     startDate           DateTime
//     endDate             DateTime?
//     phenomena           String[]
//     centerpoint         Json?
//     events              CampaignEvent[]
//     exposure            Exposure
//     hardwareAvailable   Boolean
//     comments            Comment[]
//     devices             Device[]
//     bookmarks           CampaignBookmark[]
//   }

export const campaign = pgTable("campaign", {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    ownerId: text("owner_id").notNull(),
    feature: json("feature"),
    description: text("description").notNull(),
    instructions: text("instructions").notNull(),
    countries: text("countries").array(),
    priority: priorityEnum("priority"),
    minimumParticipants: integer("minimumParticipants").default(1),
    startDate: timestamp("startDate").defaultNow().notNull(),
    endDate: timestamp("endDate").defaultNow().notNull(),
    phenomena: text("phenomena").array(),
    centerpoint: json("centerpoint"),
    exposure: exposureEnum("exposure"),
    hardwareAvailable: boolean("hardwareAvailable")   
})

export const campaignRelations = relations(campaign, ({one, many}) => ({
    user: one(user, {
        fields: [campaign.ownerId],
        references: [user.id]
    }),
    comments: many(comment),
    posts: many(post),
    participants: many(usersToCampaigns),
    bookmarks: many(bookmarkedCampaigns)
}))

export type Campaign = InferSelectModel<typeof campaign>;
export type InsertCampaign = InferInsertModel<typeof campaign>;