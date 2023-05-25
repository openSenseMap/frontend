import * as z from "zod";

function checkValidDates(startDate: Date, endDate: Date | undefined) {
  if (startDate && endDate) {
    return startDate <= endDate;
  }
  return true;
}

export const campaignSchema = z
  .object({
    title: z.string().min(3).max(52),
    description: z.string().min(5),
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
  })
  .refine(
    (data) => checkValidDates(data.startDate, data.endDate),
    "Start date must be earlier than End date."
  );
