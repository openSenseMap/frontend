import { pgEnum } from "drizzle-orm/pg-core";

export const exposureEnum = pgEnum("exposure", [
  "indoor",
  "outdoor",
  "mobile",
  "unknown",
]);

export const statusEnum = pgEnum("status", ["active", "inactive", "old"]);
