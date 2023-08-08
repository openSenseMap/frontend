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
    // select: {
    //   id: true,
    //   name: true,
    //   description: true,
    //   exposure: true,
    //   status: true,
    //   updatedAt: true,
    //   sensors: true,
    //   latitude: true,
    //   longitude: true,
    //   useAuth: true,
    //   model: true,
    //   public: true,
    //   createdAt: true,
    //   userId: true,
    // },
    where: { id },
  });
}

export function getDeviceWithoutSensors({ id }: Pick<Device, "id">) {
  return prisma.device.findUnique({
    select: {
      id: true,
      name: true,
      exposure: true,
      updatedAt: true,
      latitude: true,
      longitude: true,
    },
    where: { id },
  });
}

export function updateDeviceInfo({
  id,
  name,
  exposure,
}: Pick<Device, "id" | "name" | "exposure">) {
  return prisma.device.update({
    where: { id },
    data: {
      name: name,
      exposure: exposure,
    },
  });
}

export function updateDeviceLocation({
  id,
  latitude,
  longitude,
}: Pick<Device, "id" | "latitude" | "longitude">) {
  return prisma.device.update({
    where: { id },
    data: {
      latitude: latitude,
      longitude: longitude,
    },
  });
}

export function deleteDevice({ id }: Pick<Device, "id">) {
  return prisma.device.delete({ where: { id } });
}

export function getUserDevices(userId: Device["userId"]) {
  return prisma.device.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      exposure: true,
      model: true,
      createdAt: true,
      updatedAt: true,
    },
    where: { userId },
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
      status: true,
      createdAt: true,
    },
  });
  const geojson: GeoJSON.FeatureCollection<Point> = {
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

export async function getMeasurements(
  deviceId: string,
  sensorId: string,
  startDate: Date,
  endDate: Date
) {
  const response = await fetch(
    process.env.OSEM_API_URL +
      "/boxes/" +
      deviceId +
      "/data/" +
      sensorId +
      "?from-date=" +
      startDate.toISOString() + //new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString() + //24 hours ago
      "&to-date=" +
      endDate.toISOString() //new Date().toISOString()
  );
  return (await response.json()) as {
    value: string;
    location?: number[];
    createdAt: Date;
  }[];
}
