import * as z from "zod";

function checkValidDates(startDate: Date, endDate: Date | undefined) {
  if (startDate && endDate) {
    return startDate <= endDate;
  }
  return true;
}

export const campaignEventSchema = z
  .object({
    title: z
      .string()
      .min(3, "Der Titel muss mindestens 5 Zeichen lang sein!")
      .max(52),
    description: z
      .string()
      .min(5, "Die Beschreibung muss mindestens 5 Zeichen lang sein!"),
    createdAt: z.date(),
    updatedAt: z.date(),
    startDate: z
      .date()
      .refine((value) => value !== undefined && value !== null, {
        message: "Dies ist ein Pflichtfeld!",
      }),
    endDate: z.date().optional(),
  })
  .refine(
    (data) => checkValidDates(data.startDate, data.endDate),
    "Der Beginn muss früher sein als der Abschluss der Kampagne!"
  );
