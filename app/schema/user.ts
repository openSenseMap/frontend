import { createId } from "@paralleldrive/cuid2";
import  { type InferInsertModel, type InferSelectModel, relations  } from "drizzle-orm";
import { pgTable, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { device } from "./device";
import { password } from "./password";
import { profile } from "./profile";

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
  emailIsConfirmed: boolean("email_is_confirmed").default(false),
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
}));

/**
 * Types
 */
export type User = InferSelectModel<typeof user>;
export type InsertUser = InferInsertModel<typeof user>;
