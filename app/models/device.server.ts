import type { Device } from "@prisma/client";
import { prisma } from "~/db.server";

import { point } from "@turf/helpers";
// import jsonstringify from "stringify-stream";
// import streamify from "stream-array";
import type { Point } from "geojson";

// TODO not sure why the replacer is not working!
// const geoJsonStringifyReplacer = function geoJsonStringifyReplacer(
//   key: any,
//   device: any
// ) {
//   if (key === "") {
//     const coordinates = [device.latitude, device.longitude];
//     return point<Device>(coordinates, device);
//   }
// };

export function getDevice({ id }: Pick<Device, "id">) {
  return prisma.device.findFirst({
    select: { id: true, name: true, exposure: true },
    where: { id },
  });
}

export async function getDevices() {
  // const opts = {
  //   open: '{"type":"FeatureCollection","features":[',
  //   close: "]}",
  //   geoJsonStringifyReplacer,
  // };

  const devices = await prisma.device.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      exposure: true,
      createdAt: true,
    },
  });
  const geojson: GeoJSON.FeatureCollection<Point, any> = {
    type: "FeatureCollection",
    features: [],
  };

  // return streamify(devices).pipe(jsonstringify(opts));

  for (const device of devices) {
    const coordinates = [device.longitude, device.latitude];
    const feature = point(coordinates, device);
    geojson.features.push(feature);
  }

  return geojson;
}
