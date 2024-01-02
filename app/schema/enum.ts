import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const exposureEnum = pgEnum("exposure", [
  "indoor",
  "outdoor",
  "mobile",
  "unknown",
]);

const exposureZodEnum = z.enum(exposureEnum.enumValues)


export type zodExposureEnum = z.infer<typeof exposureZodEnum>

export const priorityEnum = pgEnum("priority", [
  "urgent",
  "high",
  "medium",
  "low"
])

const priorityZodEnum = z.enum(priorityEnum.enumValues)


export type zodPriorityEnum = z.infer<typeof priorityZodEnum>

export const statusEnum = pgEnum("status", ["active", "inactive", "old"]);

export const deviceModelEnum = pgEnum("model", ["HOME_V2_LORA"]);