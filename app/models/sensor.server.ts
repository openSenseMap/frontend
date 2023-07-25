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
