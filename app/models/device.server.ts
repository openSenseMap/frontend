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
    select: {
      id: true,
      name: true,
      exposure: true,
      status: true,
      updatedAt: true,
      sensors: true,
      latitude: true,
      longitude: true,
    },
    where: { id },
  });
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

export async function getDevicesWithSensors() {
  const devices = await prisma.device.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      exposure: true,
      createdAt: true,
      sensors: true,
      status: true,
    },
  });
  const geojson: GeoJSON.FeatureCollection<Point, any> = {
    type: "FeatureCollection",
    features: [],
  };

  for (const device of devices) {
    const coordinates = [device.longitude, device.latitude];
    const feature = point(coordinates, device);
    geojson.features.push(feature);
  }

  return geojson;
}

export async function getMeasurements(
  deviceId: any,
  sensorId: any,
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
  const jsonData = await response.json();
  return jsonData;
}

export async function createDeviceInOsemAPIandPostgres(deviceData: any) {
  console.log("creating device");

  // hack to register to OSEM API
  const authData = await fetch(
    `${process.env.OSEM_API_TESTING}/users/sign-in`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "umut@sensebox.de",
        password: "testtest",
      }),
    }
  ).then((res) => res.json());
  const registeredDevice = await createDeviceOsemAPI(
    deviceData,
    authData.token
  );

  const newDevicePostgres = await createDevicePostgres(registeredDevice);
  return newDevicePostgres;
}

export async function createDevicePostgres(deviceData: any) {
  const newDevice = await prisma.device.create({
    data: {
      id: deviceData._id,
      userId: deviceData.user,
      name: deviceData.name,
      exposure: deviceData.exposure,
      useAuth: true,
      latitude: Number(deviceData.latitude),
      longitude: Number(deviceData.longitude),
    },
  });
  return newDevice;
}

export async function createDeviceOsemAPI(deviceData: any, token: string) {
  const registerDevice = await fetch(`${process.env.OSEM_API_TESTING}/bxoes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: deviceData.name,
      grouptag: deviceData.groupId,
      exposure: deviceData.exposure,
      model: deviceData.type,
      location: {
        lat: deviceData.lat,
        lng: deviceData.lng,
        ...(deviceData.height && { height: deviceData.height }),
      },
      ...(deviceData.ttnEnabled && {
        ttn: {
          dev_id: deviceData.ttnDeviceId,
          app_id: deviceData.ttnAppId,
          profile: "???",
        },
      }),
      ...(deviceData.mqttEnabled && {
        mqtt: {
          enabled: true,
          url: deviceData.mqttUrl,
          topic: deviceData.mqttTopic,
          messageFormat: "json",
          decodeOptions: deviceData.mqttDecodeOptions,
          connectionOptions: deviceData.mqttConnectOptions,
        },
      }),
    }),
  }).then((res) => res.json());
  console.log("🚀 registered Device:", registerDevice);

  return registerDevice;
}
