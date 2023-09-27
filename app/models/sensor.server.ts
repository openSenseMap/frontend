import type { Sensor } from "@prisma/client";
import { prisma } from "~/db.server";

import { point } from "@turf/helpers";
// import jsonstringify from "stringify-stream";
// import streamify from "stream-array";
import type { Point } from "geojson";

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

//if sensor was registered through osem-frontend the input sensor will have correct sensor-wiki connotations
export async function registerSensor(sensor: Sensor) {
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
  return prisma.sensor.findMany({
    where: { deviceId },
  });
}

export function addNewSensor({
  title,
  unit,
  sensorType,
  deviceId,
}: Pick<Sensor, "title" | "unit" | "sensorType" | "deviceId">) {
  return prisma.sensor.create({
    data: {
      title: title,
      unit: unit,
      sensorType: sensorType,
      deviceId: deviceId,
    },
  });
}

export function updateSensor({
  id,
  title,
  unit,
  sensorType,
  icon,
}: Pick<Sensor, "id" | "title" | "unit" | "sensorType" | "icon">) {
  return prisma.sensor.update({
    data: {
      title: title,
      unit: unit,
      sensorType: sensorType,
      icon: icon,
    },
    where: { id },
  });
}

export function deleteSensor(id: Sensor["id"]) {
  return prisma.sensor.delete({ where: { id } });
}
