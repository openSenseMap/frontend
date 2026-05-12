import { isNotNull, isNull, ne, and, asc, eq } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import { type SensorWikiTranslation } from "~/lib/sensor-wiki";
import { device, sensor } from "../schema";

export type Phenomenon = {
  id: number;
  slug: string;
  markdown: SensorWikiTranslation;
  label: SensorWikiTranslation;
  description: SensorWikiTranslation;
};

/**
 * Queries the database for a distinct list of all sensor titles / phenomena
 * known to the application across all non-archived devices.
 */
export const getPhenomena = async function findPhenomena(): Promise<string[]> {
  const rows = await drizzleClient
    .selectDistinct({
      title: sensor.title,
    })
    .from(sensor)
    .innerJoin(device, eq(sensor.deviceId, device.id))
    .where(and(isNull(device.archivedAt), isNotNull(sensor.title), ne(sensor.title, "")))
    .orderBy(asc(sensor.title));

  return rows.map((row) => row.title);
};
