import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import {
  location,
  measurement,
  measurements10minView,
  measurements1dayView,
  measurements1hourView,
  measurements1monthView,
  measurements1yearView,
  sensor,
} from "~/schema";

// This function retrieves measurements from the database based on the provided parameters.
export function getMeasurement(
  sensorId: string,
  aggregation: string,
  startDate?: Date,
  endDate?: Date,
) {
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
    } else if (aggregation === "1h") {
      return drizzleClient
        .select()
        .from(measurements1hourView)
        .where(
          and(
            eq(measurements1hourView.sensorId, sensorId),
            gte(measurements1hourView.time, startDate),
            lte(measurements1hourView.time, endDate),
          ),
        )
        .orderBy(desc(measurements1hourView.time));
    } else if (aggregation === "1d") {
      return drizzleClient
        .select()
        .from(measurements1dayView)
        .where(
          and(
            eq(measurements1dayView.sensorId, sensorId),
            gte(measurements1dayView.time, startDate),
            lte(measurements1dayView.time, endDate),
          ),
        )
        .orderBy(desc(measurements1dayView.time));
    } else if (aggregation === "1m") {
      return drizzleClient
        .select()
        .from(measurements1monthView)
        .where(
          and(
            eq(measurements1monthView.sensorId, sensorId),
            gte(measurements1monthView.time, startDate),
            lte(measurements1monthView.time, endDate),
          ),
        )
        .orderBy(desc(measurements1monthView.time));
    } else if (aggregation === "1y") {
      return drizzleClient
        .select()
        .from(measurements1yearView)
        .where(
          and(
            eq(measurements1yearView.sensorId, sensorId),
            gte(measurements1yearView.time, startDate),
            lte(measurements1yearView.time, endDate),
          ),
        )
        .orderBy(desc(measurements1yearView.time));
    }
    // If aggregation is not specified or different from "15m" and "1d", fetch default measurements.
    return drizzleClient.query.measurement.findMany({
      where: (measurement, { eq, gte, lte }) =>
        and(
          eq(measurement.sensorId, sensorId),
          gte(measurement.time, startDate),
          lte(measurement.time, endDate),
        ),
      orderBy: [desc(measurement.time)],
      with: {
        location: {
          // https://github.com/drizzle-team/drizzle-orm/pull/2778
          // with: {
          //   geometry: true
          // },
          columns: {
            id: true,
          },
          extras: {
            x: sql<number>`ST_X(${location.location})`.as("x"),
            y: sql<number>`ST_Y(${location.location})`.as("y"),
          },
        },
      },
    });
  }

  // If only aggregation is provided, fetch measurements without considering time range.
  if (aggregation === "10m") {
    return drizzleClient
      .select()
      .from(measurements10minView)
      .where(eq(measurements10minView.sensorId, sensorId))
      .orderBy(desc(measurements10minView.time));
  } else if (aggregation === "1h") {
    return drizzleClient
      .select()
      .from(measurements1hourView)
      .where(eq(measurements1hourView.sensorId, sensorId))
      .orderBy(desc(measurements1hourView.time));
  } else if (aggregation === "1d") {
    return drizzleClient
      .select()
      .from(measurements1dayView)
      .where(eq(measurements1dayView.sensorId, sensorId))
      .orderBy(desc(measurements1dayView.time));
  } else if (aggregation === "1m") {
    return drizzleClient
      .select()
      .from(measurements1monthView)
      .where(eq(measurements1monthView.sensorId, sensorId))
      .orderBy(desc(measurements1monthView.time));
  } else if (aggregation === "1y") {
    return drizzleClient
      .select()
      .from(measurements1yearView)
      .where(eq(measurements1yearView.sensorId, sensorId))
      .orderBy(desc(measurements1yearView.time));
  }

  // If neither start date nor aggregation are specified, fetch default measurements with a limit of 20000.
  return drizzleClient.query.measurement.findMany({
    where: (measurement, { eq }) => eq(measurement.sensorId, sensorId),
    orderBy: [desc(measurement.time)],
    with: {
      location: {
        // https://github.com/drizzle-team/drizzle-orm/pull/2778
        // with: {
        //   geometry: true
        // },
        columns: {
          id: true,
        },
        extras: {
          x: sql<number>`ST_X(${location.location})`.as("x"),
          y: sql<number>`ST_Y(${location.location})`.as("y"),
        },
      },
    },
    limit: 3600, // 60 measurements per hour * 24 hours * 2.5 days
  });
}


export async function saveMeasurements(device: any, measurements: any[]): Promise<void> {
  if (!Array.isArray(measurements)) throw new Error("Array expected");

  const sensorIds = device.sensors.map((s: any) => s.id);
  const lastMeasurements: Record<string, any> = {};



  // find new lastMeasurements (iterate from end to keep latest)
  for (let i = measurements.length - 1; i >= 0; i--) {
    const m = measurements[i];

    if (!sensorIds.includes(m.sensor_id)) {
      const error = new Error(`Measurement for sensor with id ${m.sensor_id} does not belong to box`);
      error.name = "ModelError";
      throw error;
    }

    const now = new Date();
    const maxFutureTime = 30 * 1000; // 30 seconds

    const measurementTime = new Date(m.createdAt || Date.now());
    if (measurementTime.getTime() > now.getTime() + maxFutureTime) {
      const error = new Error(`Measurement timestamp is too far in the future: ${measurementTime.toISOString()}`);
      error.name = "ModelError";
      (error as any).type = "UnprocessableEntityError";
      throw error;
    }

    if (!lastMeasurements[m.sensor_id]) {
      lastMeasurements[m.sensor_id] = {
        value: m.value,
        createdAt: measurementTime.toISOString(),
        sensorId: m.sensor_id,
      };
    }
  }

  // Prepare inserts for the measurement table
  const measurementInserts = measurements.map((m) => ({
    sensorId: m.sensor_id,
    value: m.value,
    time: m.createdAt ? new Date(m.createdAt) : new Date(),
  }));


  await drizzleClient.transaction(async (tx) => {
    await tx.insert(measurement).values(measurementInserts);

    const updatePromises = Object.entries(lastMeasurements).map(([sensorId, lastMeasurement]) =>
      tx
        .update(sensor)
        .set({ lastMeasurement: JSON.stringify(lastMeasurement) })
        .where(eq(sensor.id, sensorId))
    );

    await Promise.all(updatePromises);

  });
}

async function insertMeasurements(measurements: any[]): Promise<void> {
  const measurementInserts = measurements.map(measurement => ({
    sensorId: measurement.sensor_id,
    value: measurement.value,
    time: measurement.createdAt || new Date(),
  }));



  await drizzleClient.insert(measurement).values(measurementInserts);
}

async function insertMeasurement(measurement: any): Promise<any> {
  return drizzleClient.insert(measurement).values({
    sensorId: measurement.sensor_id,
    value: measurement.value,
    time: measurement.createdAt
  });
}

