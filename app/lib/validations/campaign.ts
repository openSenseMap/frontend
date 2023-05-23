import * as z from "zod";

export const campaignSchema = z.object({
  title: z.string().min(3).max(52),
  description: z.string(),
  feature: z.any(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  country: z.string(),
  participantCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
  startDate: z.date(),
  endDate: z.date().optional(),
  phenomena: z.array(z.string()),
  exposure: z.enum(["UNKNOWN", "INDOOR", "MOBILE", "OUTDOOR"]),
  hardware_available: z.boolean(),
  centerpoint: z.any(),
  requiredParticipants: z.number().int().nonnegative(),
  requiredSensors: z.number().int().nonnegative(),
});
