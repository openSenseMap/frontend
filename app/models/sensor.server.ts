import { eq, sql } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import {
  sensor,
  type Sensor,
  type SensorWithLatestMeasurement,
} from "~/schema";
// import { point } from "@turf/helpers";
// import type { Point } from "geojson";

export function getSensors(deviceId: Sensor["deviceId"]) {
  return drizzleClient.query.sensor.findMany({
    where: (sensor, { eq }) => eq(sensor.deviceId, deviceId),
  });

  // const geojson: GeoJSON.FeatureCollection<Point, any> = {
  //   type: "FeatureCollection",
  //   features: [],
  // };

  // // return streamify(devices).pipe(jsonstringify(opts));
  // for (const sensor of sensors) {
  //   const coordinates = [sensor.device.longitude, sensor.device.latitude];
  //   const feature = point(coordinates, sensor);
  //   geojson.features.push(feature);
  // }

  // return sensors;
}

// import jsonstringify from "stringify-stream";
// import streamify from "stream-array";

// export async function getSensors() {
//   // const opts = {
//   //   open: '{"type":"FeatureCollection","features":[',
//   //   close: "]}",
//   //   geoJsonStringifyReplacer,
//   // };

//   const sensors = await prisma.sensor.findMany({
//     include: {
//       device: {
//         select: {
//           latitude: true,
//           longitude: true,
//         },
//       },
//     },
//   });
//   const geojson: GeoJSON.FeatureCollection<Point, any> = {
//     type: "FeatureCollection",
//     features: [],
//   };

//   // return streamify(devices).pipe(jsonstringify(opts));
//   for (const sensor of sensors) {
//     const coordinates = [sensor.device.longitude, sensor.device.latitude];
//     const feature = point(coordinates, sensor);
//     geojson.features.push(feature);
//   }

//   return sensors;
// }

export function getSensorsFromDevice(deviceId: Sensor["deviceId"]) {
  return drizzleClient.query.sensor.findMany({
    where: (sensor, { eq }) => eq(sensor.deviceId, deviceId),
  });
}

// LATERAL JOIN to get latest measurement for sensors belonging to a specific device, including device name
export function getSensorsWithLastMeasurement(
  deviceId: Sensor["deviceId"],
  count: number = 1,
) {
  const result = drizzleClient.execute(
    sql`SELECT s.*, d.name AS device_name, measure.*
    FROM sensor s
    JOIN device d ON s.device_id = d.id
    LEFT JOIN LATERAL (
      SELECT * FROM measurement m
      WHERE m.sensor_id = s.id
      ORDER BY m.time DESC
      LIMIT ${count}
    ) AS measure ON true
    WHERE s.device_id = ${deviceId};`,
  );

  return result as unknown as SensorWithLatestMeasurement[];
}

//if sensor was registered through osem-frontend the input sensor will have correct sensor-wiki connotations
export async function registerSensor(newSensor: Sensor) {
  const insertedSensor = await drizzleClient
    .insert(sensor)
    .values({
      id: newSensor.id,
      deviceId: newSensor.deviceId,
      title: newSensor.title,
      sensorType: newSensor.sensorType,
      unit: newSensor.unit,
      sensorWikiType: newSensor.sensorType,
      sensorWikiUnit: newSensor.unit,
      sensorWikiPhenomenon: newSensor.title,
    })
    .returning();

  return insertedSensor;
}

export function addNewSensor({
  title,
  unit,
  sensorType,
  deviceId,
}: Pick<Sensor, "title" | "unit" | "sensorType" | "deviceId">) {
  return drizzleClient.insert(sensor).values({
    title,
    unit,
    sensorType,
    deviceId,
  });
}

export function updateSensor({
  id,
  title,
  unit,
  sensorType, // icon,
}: Pick<Sensor, "id" | "title" | "unit" | "sensorType">) {
  return drizzleClient
    .update(sensor)
    .set({
      title,
      unit,
      sensorType,
    })
    .where(eq(sensor.id, id));
}

// return first sensor with its device name
export function getSensor(id: Sensor["id"]) {
  return drizzleClient.query.sensor.findFirst({
    where: (sensor, { eq }) => eq(sensor.id, id),
  });
}

export function deleteSensor(id: Sensor["id"]) {
  return drizzleClient.delete(sensor).where(eq(sensor.id, id));
}
