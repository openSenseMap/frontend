import { measurement, measurements10minView } from "~/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzleClient } from "~/db.server";

// This function retrieves measurements from the database based on the provided parameters.
export function getMeasurement(
  sensorId: string,
  aggregation: string,
  startDate?: Date,
  endDate?: Date,
) {
  console.log(
    `[measurement.server.ts]: ${sensorId} - ${aggregation} - ${startDate} - ${endDate}`,
  );

  // If both start date and end date are provided, filter measurements within the specified time range.
  if (startDate && endDate) {
    // Check the aggregation level for measurements and fetch accordingly.
    if (aggregation === "10m") {
      return drizzleClient
        .select()
        .from(measurements10minView)
        .where(
          and(
            eq(measurements10minView.sensorId, sensorId),
            gte(measurements10minView.time, startDate),
            lte(measurements10minView.time, endDate),
          ),
        )
        .orderBy(desc(measurements10minView.time));
    } else if (aggregation === "1d") {
      return drizzleClient
        .select()
        .from(measurements10minView)
        .where(
          and(
            eq(measurements10minView.sensorId, sensorId),
            gte(measurements10minView.time, startDate),
            lte(measurements10minView.time, endDate),
          ),
        )
        .orderBy(desc(measurements10minView.time));
    }
    // If aggregation is not specified or different from "15m" and "1d", fetch default measurements.
    return drizzleClient.query.measurement.findMany({
      where: (measurement, { eq, gte, lte }) =>
        eq(measurement.sensorId, sensorId) &&
        gte(measurement.time, startDate) &&
        lte(measurement.time, endDate),
      orderBy: [desc(measurement.time)],
    });
  }

  // If only aggregation is provided, fetch measurements without considering time range.
  if (aggregation === "10m") {
    return drizzleClient
      .select()
      .from(measurements10minView)
      .where(eq(measurements10minView.sensorId, sensorId))
      .orderBy(desc(measurements10minView.time));
  } else if (aggregation === "1d") {
    return drizzleClient
      .select()
      .from(measurements10minView)
      .where(eq(measurements10minView.sensorId, sensorId))
      .orderBy(desc(measurements10minView.time));
  }

  // If neither start date nor aggregation are specified, fetch default measurements with a limit of 20000.
  return drizzleClient.query.measurement.findMany({
    where: (measurement, { eq }) => eq(measurement.sensorId, sensorId),
    orderBy: [desc(measurement.time)],
    limit: 20000,
  });
}
