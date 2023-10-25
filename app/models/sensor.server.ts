import { eq } from "drizzle-orm";
import { sensor, type InsertSensor, type Sensor } from "db/schema";
import { drizzleClient } from "~/db.server";
import { point } from "@turf/helpers";
import type { Point } from "geojson";

export function getSensors(deviceId: Sensor["deviceId"]) {
  return drizzleClient.query.sensor.findMany({
    where: (sensor, { eq }) => eq(sensor.deviceId, deviceId),
  });
}

// import jsonstringify from "stringify-stream";
// import streamify from "stream-array";

export async function getSensors() {
  // const opts = {
  //   open: '{"type":"FeatureCollection","features":[',
  //   close: "]}",
  //   geoJsonStringifyReplacer,
  // };

  const sensors = await prisma.sensor.findMany({
    include: {
      device: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
    },
  });
  const geojson: GeoJSON.FeatureCollection<Point, any> = {
    type: "FeatureCollection",
    features: [],
  };

  // return streamify(devices).pipe(jsonstringify(opts));
  for (const sensor of sensors) {
    const coordinates = [sensor.device.longitude, sensor.device.latitude];
    const feature = point(coordinates, sensor);
    geojson.features.push(feature);
  }

  return sensors;
}

export function getSensorsFromDevice(deviceId: Sensor["deviceId"]) {
  // // TODO: use drizzle
  return prisma.sensor.findMany({
    where: { deviceId },
  });
}

//if sensor was registered through osem-frontend the input sensor will have correct sensor-wiki connotations
export async function registerSensor(sensor: Sensor) {
  // // TODO: use drizzle
  const sensors = await prisma.sensor.create({
    data: {
      id: sensor.id,
      deviceId: sensor.deviceId,
      title: sensor.title,
      sensorType: sensor.sensorType,
      unit: sensor.unit,
      sensorWikiType: sensor.sensorType,
      sensorWikiUnit: sensor.unit,
      sensorWikiPhenomenon: sensor.title,
    },
  });

  return sensors;
}

export function getSensorsForDevice(deviceId: Sensor["deviceId"]) {
  // // TODO: use drizzle
  return prisma.sensor.findMany({
    where: { deviceId },
  });
}

export function addNewSensor({
  title,
  unit,
  sensorType,
  deviceId,
}: Pick<InsertSensor, "title" | "unit" | "sensorType" | "deviceId">) {
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
  sensorType,
  icon,
}: Pick<InsertSensor, "id" | "title" | "unit" | "sensorType">) {
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
