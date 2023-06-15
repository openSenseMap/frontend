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

export const campaignUpdateSchema = z.object({
  title: z.string().min(3).max(52).optional(),
  description: z.string().min(5).optional(),
  feature: z.any().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  country: z.string().optional(),
  participantCount: z.number().int().nonnegative().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  phenomena: z.array(z.string()).optional(),
  exposure: z.enum(["UNKNOWN", "INDOOR", "MOBILE", "OUTDOOR"]).optional(),
  hardware_available: z.boolean().optional(),
  centerpoint: z.any().optional(),
  requiredParticipants: z.number().int().nonnegative().optional(),
  requiredSensors: z.number().int().nonnegative().optional(),
});
// .refine(
//   (data) => checkValidDates(data.startDate, data.endDate),
//   "Start date must be earlier than End date."
// );
