import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel} from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { bytea } from "./types";
import { profile } from "./profile";

/**
 * Table
 */
export const profileImage = pgTable("profile_image", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  altText: text("alt_text"),
  contentType: text("content_type").notNull(),
  blob: bytea("blob").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  profileId: text("profile_id").references(() => profile.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),

});

/**
 * Types
 */
export type SelectImage = InferSelectModel<typeof profileImage>;
export type InsertImage = InferInsertModel<typeof profileImage>;
