import { count, eq } from "drizzle-orm";
import { sensor, type Sensor } from "~/schema";
import { drizzleClient } from "~/db.server";
// import { point } from "@turf/helpers";
// import type { Point } from "geojson";

export async function countSensors() {
  const sensorCount = await drizzleClient
    .select({ count: count() })
    .from(sensor);
  return sensorCount[0].count;
}

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

// FIXME: This is exactly the same as getSensorsForDevice!!!
export function getSensorsFromDevice(deviceId: Sensor["deviceId"]) {
  return drizzleClient.query.sensor.findMany({
    where: (sensor, { eq }) => eq(sensor.deviceId, deviceId),
  });
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

export function getSensorsForDevice(deviceId: Sensor["deviceId"]) {
  return drizzleClient.query.sensor.findMany({
    where: (sensor, { eq }) => eq(sensor.deviceId, deviceId),
  });
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

export function deleteSensor(id: Sensor["id"]) {
  return drizzleClient.delete(sensor).where(eq(sensor.id, id));
}
