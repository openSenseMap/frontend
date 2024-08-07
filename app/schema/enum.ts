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

export const statusEnum = pgEnum("status", ["active", "inactive", "old"]);

const statusZodEnum = z.enum(statusEnum.enumValues)

export type zodStatusEnum = z.infer<typeof statusZodEnum>



export const deviceModelEnum = pgEnum("model", ["HOME_V2_LORA"]);