import { and, desc, eq, gte, inArray, lte, or, SQL, sql } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import {
  deviceToLocation,
  LastMeasurement,
  location,
  Measurement,
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

interface MeasurementWithLocation {
  sensor_id: string;
  value: number;
  createdAt?: Date;
  location?: {
    lng: number;
    lat: number;
    height?: number;
  } | null;
}

interface MeasurementWithLocation {
  sensor_id: string;
  value: number;
  createdAt?: Date;
  location?: {
    lng: number;
    lat: number;
    height?: number;
  } | null;
}

// TODO: Remove if inline location sql works
/**
 * Get the device location that was valid at a specific timestamp
 * @returns the most recent location that was set before or at the given timestamp
 */
async function getDeviceLocationAtTime(
  tx: any,
  deviceId: string,
  timestamp: Date
): Promise<bigint | null> {
  const locationAtTime = await tx
    .select({
      locationId: deviceToLocation.locationId,
    })
    .from(deviceToLocation)
    .where(
      and(
        eq(deviceToLocation.deviceId, deviceId),
        lte(deviceToLocation.time, timestamp)
      )
    )
    .orderBy(desc(deviceToLocation.time))
    .limit(1);

  return locationAtTime.length > 0 ? locationAtTime[0].locationId : null;
}

type Location = {
  lng: number;
  lat: number;
  height?: number;
};

type DeviceLocationUpdate = {
  location: Location;
  time: Date;
};

type MinimalDevice = {
  id: string,
  sensors: Array<{
    id: string
  }>
};

// TODO Unit test this function
export async function saveMeasurements(
  device: MinimalDevice, 
  measurements: MeasurementWithLocation[]
): Promise<void> {
  if (!device)
    throw new Error("No device given!")
  if (!Array.isArray(measurements)) throw new Error("Array expected");

  const sensorIds = device.sensors.map((s: any) => s.id);
  const lastMeasurements: Record<string, NonNullable<LastMeasurement>> = {};

  // Validate and prepare measurements
  for (let i = measurements.length - 1; i >= 0; i--) {
    const m = measurements[i];

    if (!sensorIds.includes(m.sensor_id)) {
      const error = new Error(
        `Measurement for sensor with id ${m.sensor_id} does not belong to box`
      );
      error.name = "ModelError";
      throw error;
    }

    const now = new Date();
    const maxFutureTime = 30 * 1000; // 30 seconds

    const measurementTime = new Date(m.createdAt || Date.now());
    if (measurementTime.getTime() > now.getTime() + maxFutureTime) {
      const error = new Error(
        `Measurement timestamp is too far in the future: ${measurementTime.toISOString()}`
      );
      error.name = "ModelError";
      (error as any).type = "UnprocessableEntityError";
      throw error;
    }

    if (!lastMeasurements[m.sensor_id] ||
      lastMeasurements[m.sensor_id].createdAt < measurementTime.toISOString()) {
      lastMeasurements[m.sensor_id] = {
        value: m.value,
        createdAt: measurementTime.toISOString(),
        sensorId: m.sensor_id,
      };
    }
  }

  // Track measurements that update device location (those with explicit locations)
  const deviceLocationUpdates = getLocationUpdates(measurements);
  const locationMap = await findOrCreateLocations(deviceLocationUpdates);
  
  // First, update device locations for all measurements with explicit locations
  // This ensures the location history is complete before we infer locations
  await addLocationUpdates(deviceLocationUpdates, device.id, locationMap);

  // Note that the insertion of measurements and update of sensors need to be in one
  // transaction, since otherwise other updates could get in between and the data would be
  // inconsistent. This shouldn't be a problem for the updates above.
  await drizzleClient.transaction(async (tx) => {
    // Now process each measurement and infer locations if needed
    await insertMeasurementsWithLocation(measurements, locationMap, device.id, tx);
    // Update sensor lastMeasurement values
    await updateLastMeasurements(lastMeasurements, tx);
  });
}

/**
 * Extracts location updates from measurements (with explicit locations)
 * @param measurements The measurements with potential location udpates
 * @returns The found location updates, sorted oldest first
 */
function getLocationUpdates(measurements: MeasurementWithLocation[]): DeviceLocationUpdate[] {
  return (
		measurements
			.filter((measurement) => measurement.location)
			.map((measurement) => {
				return {
					location: measurement.location as Location,
					time: new Date(measurement.createdAt || Date.now()),
				}
			})
			// Sort device location updates by time (oldest first) to process in order
			.sort((a, b) => a.time.getTime() - b.time.getTime())
	)
}

/**
 * Makes sure all locations for the location updates are in the database
 * @param locationUpdates The location updates from `getLocationUpdates`
 * @returns A map of the IDs of the locations for the location updates
 */
async function findOrCreateLocations(locationUpdates: DeviceLocationUpdate[]): Promise<Map<Location, bigint>> {

  const newLocations = locationUpdates.map(update => update.location);

  let locationMap: Map<Location, bigint> = new Map;

  await drizzleClient.transaction(async (tx) => {
    const existingLocations = await tx
      .select({ id: location.id, location: location.location})
      .from(location)
      .where(
        or(
          ...newLocations.map(newLocation =>
            sql`ST_EQUALS(
              ${location.location},
              ST_SetSRID(ST_MakePoint(${newLocation.lng}, ${newLocation.lat}), 4326)
            )`
          )
        )
      );
    
    locationMap = new Map(existingLocations.map(location =>
      [{lng: location.location.x, lat: location.location.y, height: undefined}, location.id]
    ));

    // TODO: Validate that the locations that already exist in the database are indeed filtered out that way
    // (that is, validate that `locationMap.has` returns true for locations already existing in the db)
    const toInsert = newLocations.filter(newLocation => !locationMap.has(newLocation));

    const inserted = await tx
			.insert(location)
			.values(
				toInsert.map((newLocation) => {
					return {
						location: sql`ST_SetSRID(ST_MakePoint(${newLocation.lng}, ${newLocation.lat}), 4326)`,
					}
				}),
			)
			.returning();

    inserted.forEach((value) =>
			locationMap.set(
				{
					lng: value.location.x,
					lat: value.location.y,
					height: undefined,
				}, value.id))
  });

  return locationMap;
}

/**
 * Filters the location updates to not add older updates than the newest already existing one,
 * then inserts the filtered location updates
 * @param deviceLocationUpdates The updates to add
 * @param deviceId The device ID the updates are referring to
 * @param locationMap The map with the IDs of the locations already in the database
 */
async function addLocationUpdates(deviceLocationUpdates: DeviceLocationUpdate[], deviceId: string, locationMap: Map<Location, bigint>) {
  await drizzleClient.transaction(async (tx) => {
    let filteredUpdates = await filterLocationUpdates(deviceLocationUpdates, deviceId, tx);

    filteredUpdates
			.filter((update) => !locationMap.has(update.location))
			.forEach((update) => {
				throw new Error(`Location ID for location ${update.location} not found,
        even though it should've been inserted`)
			})

    await tx
      .insert(deviceToLocation)
      .values(filteredUpdates.map(update => {
        return {
          deviceId: deviceId,
          locationId: locationMap.get(update.location) as bigint,
          time: update.time
        };
      }))
      .onConflictDoNothing();
  })
}

/**
 * Filters out location updates that don't need to be inserted because they're older than the latest update
 * @param deviceLocationUpdates The device location updates to filter through
 */
async function filterLocationUpdates(deviceLocationUpdates: DeviceLocationUpdate[], deviceId: string, tx: any):
    Promise<DeviceLocationUpdate[]> {
  const currentLatestLocation = await tx
    .select({ time: deviceToLocation.time })
    .from(deviceToLocation)
    .where(eq(deviceToLocation.deviceId, deviceId))
    .orderBy(desc(deviceToLocation.time))
    .limit(1);

  return deviceLocationUpdates
    .filter(update => currentLatestLocation.length === 0 ||
      update.time >= currentLatestLocation[0].time
    );
}

/**
 * Inserts measurements with their evaluated locations (either from the explicit location, which is assumed to already be
 * in the location map), or from the last device location at the measurement time.
 * @param measurements The measurements to insert
 * @param locationMap The map with the location IDs for the explicit locations
 * @param deviceId The devices ID for the measurements
 * @param tx The current transaction to run the insert SQLs in
 */
async function insertMeasurementsWithLocation(measurements: MeasurementWithLocation[],
  locationMap: Map<Location, bigint>, deviceId: string, tx: any): Promise<Measurement[]> {
  const measuresWithLocationIdPromises = measurements.map(async (measurement) => {
      const measurementTime = measurement.createdAt || new Date();
      // TODO: Remove if the inline query works
      /*let locationId: bigint | null = null;

      if (measurement.location) {
        // Measurement has explicit location
        const foundLocationId = locationMap.get(measurement.location);
        if (!foundLocationId)
          throw new Error(`Location ID for location ${measurement.location} not found,
            even though it should've been inserted`)
        locationId = foundLocationId;
      } else
        // No explicit location - infer from device location history
        locationId = await getDeviceLocationAtTime(
          tx,
          deviceId,
          measurementTime,
        );*/

      return {
        sensorId: measurement.sensor_id,
        value: measurement.value,
        time: measurementTime,
        locationId: measurement.location
          ? locationMap.get(measurement.location)
          // TODO: Does this really work?
          : sql`select ${deviceToLocation.locationId}
                from ${deviceToLocation}
                where ${deviceToLocation.deviceId} = ${deviceId}
                  and ${deviceToLocation.time} <= ${measurementTime}
                order by ${deviceToLocation.time} desc
                limit 1`
      };
    });

  const measuresWithLocationId = await Promise.all(measuresWithLocationIdPromises);

  // Insert measurements with locationIds (may be null for measurements 
  // without location and before any device location was set)
  return await tx
    .insert(measurement)
    .values(measuresWithLocationId)
    .onConflictDoNothing();
}

/**
 * Updates the last measurement values for all given sensors
 * @param lastMeasurements The measurements to update, including the sensor keys as values
 * @param tx The current transaction to execute the update in
 */
async function updateLastMeasurements(lastMeasurements: Record<string, NonNullable<LastMeasurement>>, tx: any) {
  const sqlChunks: SQL[] = [
    sql`(case`,
    ...Object.entries(lastMeasurements).map(([sensorId, lastMeasurement]) =>
      sql`when ${sensor.id} = ${sensorId} then ${ lastMeasurement }`
    ),
    sql`end)`
  ];

  const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

  await tx
    .update(sensor)
    .set({ lastMeasurements: finalSql })
    .where(inArray(sensor.id, Object.keys(lastMeasurements)));
}

export async function insertMeasurements(measurements: any[]): Promise<void> {
  const measurementInserts = measurements.map(measurement => ({
    sensorId: measurement.sensor_id,
    value: measurement.value,
    time: measurement.createdAt || new Date(),
  }));

  await drizzleClient.insert(measurement).values(measurementInserts);
}

export async function deleteMeasurementsForSensor(sensorId: string) {
  return await drizzleClient.delete(measurement).where(eq(measurement.sensorId, sensorId));
}

export async function deleteMeasurementsForTime(date: Date) {
  return await drizzleClient.delete(measurement).where(eq(measurement.time, date));
}

