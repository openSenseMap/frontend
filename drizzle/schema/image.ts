import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Table
 */
export const image = pgTable("image", {
  contentType: text("contentType"),
  altText: text("altText"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
