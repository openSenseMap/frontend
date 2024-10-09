import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

// Enum for device exposure types
export const DeviceExposureEnum = pgEnum("exposure", [
  "indoor",
  "outdoor",
  "mobile",
  "unknown",
]);

// Zod schema for validating device exposure types
export const DeviceExposureZodEnum = z.enum(DeviceExposureEnum.enumValues);

// Type inferred from the Zod schema for device exposure types
export type DeviceExposureType = z.infer<typeof DeviceExposureZodEnum>;

// Enum for device status types
export const DeviceStatusEnum = pgEnum("status", [
  "active",
  "inactive",
  "old",
]);

// Zod schema for validating device status types
export const DeviceStatusZodEnum = z.enum(DeviceStatusEnum.enumValues);

// Type inferred from the Zod schema for device status types
export type DeviceStatusType = z.infer<typeof DeviceStatusZodEnum>;

// Enum for device model types
export const DeviceModelEnum = pgEnum("model", ["HOME_V2_LORA"]);
