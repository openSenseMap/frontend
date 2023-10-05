import type { Device } from "@prisma/client";
import { prisma } from "~/db.server";

import { point } from "@turf/helpers";
// import jsonstringify from "stringify-stream";
// import streamify from "stream-array";
import type { Point } from "geojson";
import { exposureHelper } from "~/lib/helpers";

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
      sensors: {
        select: {
          title: true,
        },
      },
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
  endDate: Date,
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
      endDate.toISOString(), //new Date().toISOString()
  );
  const jsonData = await response.json();
  return jsonData;
}

export async function createDevice(
  deviceData: any,
  userId: string | undefined,
) {
  // hack to register to OSEM API
  const authData = await fetch(
    `${process.env.OSEM_API_TESTING_URL}/users/sign-in`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `${process.env.TESTING_ACCOUNT}`,
        password: `${process.env.TESTING_PW}`,
      }),
    },
  ).then((res) => res.json());

  let sensorArray: any = [];
  Object.values(deviceData.sensors).forEach((sensorsOfPhenomenon: any) => {
    sensorsOfPhenomenon.forEach((sensor: any) => {
      sensorArray.push({
        name: sensor[0],
        title: sensor[2],
        sensorType: sensor[1],
        unit: sensor[3],
      });
    });
  });
  const registeredDevice = await createDeviceOsemAPI(
    { ...deviceData, sensors: sensorArray },
    authData.token,
  );
  const newDevicePostgres = await createDevicePostgres(
    registeredDevice.data,
    userId,
    sensorArray,
    deviceData,
  );
  return newDevicePostgres;
}

export async function createDevicePostgres(
  deviceData: any,
  userId: string | undefined,
  sensorArray: any[],
  formDeviceData: any,
) {
  const newDevice = await prisma.device.create({
    data: {
      id: deviceData._id,
      sensorWikiModel: formDeviceData.type,
      userId: userId ?? "unknown",
      name: deviceData.name,
      exposure: exposureHelper(deviceData.exposure),
      useAuth: deviceData.useAuth,
      latitude: Number(deviceData.currentLocation.coordinates[1]),
      longitude: Number(deviceData.currentLocation.coordinates[0]),
    },
  });

  for await (let [i, sensor] of deviceData.sensors.entries()) {
    await prisma.sensor.create({
      data: {
        id: sensor._id,
        deviceId: newDevice.id,
        title: sensorArray[i].name,
        sensorType: sensor.sensorType,
        unit: sensor.unit,
        sensorWikiType: sensor.sensorType,
        sensorWikiUnit: sensor.unit,
        sensorWikiPhenomenon: sensor.title,
      },
    });
  }

  return newDevice;
}

export async function createDeviceOsemAPI(deviceData: any, token: string) {
  const registerDevice = await fetch(
    `${process.env.OSEM_API_TESTING_URL}/boxes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: deviceData.name,
        grouptag: deviceData.groupId,
        exposure: deviceData.exposure.toLowerCase(),
        // model: deviceData.type,
        sensors: deviceData.sensors,
        location: {
          lat: deviceData.latitude,
          lng: deviceData.longitude,
          ...(deviceData.height && { height: deviceData.height }),
        },
        ...(deviceData.ttnEnabled && {
          ttn: {
            dev_id: deviceData["ttn.devId"],
            app_id: deviceData["ttn.appId"],
            profile: deviceData["ttn.decodeProfile"],
            ...(deviceData["ttn.decodeOptions"] && {
              decodeOptions: deviceData["ttn.decodeOptions"],
            }),
            ...(deviceData["ttn.port"] && { port: deviceData["ttn.port"] }),
          },
        }),
        ...(deviceData.mqttEnabled && {
          mqtt: {
            enabled: true,
            url: deviceData["mqtt.url"],
            topic: deviceData["mqtt.topic"],
            messageFormat: deviceData["mqtt.messageFormat"],
            decodeOptions: deviceData["mqtt.decodeOptions"],
            connectionOptions: deviceData["mqtt.connectOptions"],
          },
        }),
      }),
    },
  ).then((res) => res.json());

  return registerDevice;
}
