import * as z from "zod";

function checkValidDates(startDate: Date, endDate: Date | undefined) {
  if (startDate && endDate) {
    return startDate <= endDate;
  }
  return true;
}

export const campaignSchema = z
  .object({
    title: z
      .string()
      .min(3, "Der Titel muss mindestens 3 Zeichen lang sein!")
      .max(52),
    description: z
      .string()
      .min(5, "Die Beschreibung muss mindestens 5 Zeichen lang sein!"),
    instructions: z.string(),
    feature: z.any(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    countries: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    startDate: z
      .date()
      .refine((value) => value !== undefined && value !== null, {
        message: "Dies ist ein Pflichtfeld!",
      }),
    endDate: z.date().optional(),
    phenomena: z.array(z.string()),
    exposure: z.enum(["UNKNOWN", "INDOOR", "MOBILE", "OUTDOOR"]),
    hardwareAvailable: z.boolean(),
    centerpoint: z.any(),
    minimumParticipants: z
      .number()
      .int("Bitte geben Sie eine Zahl ein")
      .nonnegative("Bitte geben Sie nur positive Zahlen ein")
      .refine((value) => typeof value === "number" && value >= 1, {
        message: "Bitte geben Sie nur positive Zahlen ein!",
      }),
  })
  .refine(
    (data) => checkValidDates(data.startDate, data.endDate),
    "Der Beginn muss früher sein als der Abschluss der Kampagne!"
  );

export const campaignUpdateSchema = z
  .object({
    title: z
      .string()
      .min(3, "Der Titel muss mindestens 3 Zeichen lang sein!")
      .max(52),
    description: z
      .string()
      .min(5, "Die Beschreibung muss mindestens 5 Zeichen lang sein!"),
    instructions: z.string().optional(),
    feature: z.any().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    countries: z.array(z.string()).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date(),
    startDate: z.date(),
    endDate: z.date(),
    phenomena: z.array(z.string()),
    exposure: z.enum(["UNKNOWN", "INDOOR", "MOBILE", "OUTDOOR"]),
    hardwareAvailable: z.boolean(),
    centerpoint: z.any().optional(),
    minimumParticipants: z
      .number()
      .int("Bitte geben Sie eine Zahl ein")
      .nonnegative("Bitte geben Sie nur positive Zahlen ein")
      .optional()
      .refine((value) => typeof value === "number" && value >= 1, {
        message: "Bitte geben Sie nur positive Zahlen ein!",
      }),
  })
  .refine(
    (data) => checkValidDates(data.startDate, data.endDate),
    "Start date must be earlier than End date."
  );
