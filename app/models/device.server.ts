import { drizzleClient } from "~/db.server";
import { point } from "@turf/helpers";
import type { Point } from "geojson";
import { device, sensor, type Device, type Sensor } from "~/schema";
import { eq } from "drizzle-orm";

export function getDevice({ id }: Pick<Device, "id">) {
  return drizzleClient.query.device.findFirst({
    where: (device, { eq }) => eq(device.id, id),
    columns: {
      createdAt: true,
      description: true,
      exposure: true,
      id: true,
      image: true,
      latitude: true,
      longitude: true,
      link: true,
      model: true,
      name: true,
      sensorWikiModel: true,
      status: true,
      updatedAt: true,
    },
  });
}

export function getDeviceWithoutSensors({ id }: Pick<Device, "id">) {
  return drizzleClient.query.device.findFirst({
    where: (device, { eq }) => eq(device.id, id),
    columns: {
      id: true,
      name: true,
      exposure: true,
      updatedAt: true,
      latitude: true,
      longitude: true,
    },
  });
}

export function updateDeviceInfo({
  id,
  name,
  exposure,
}: Pick<Device, "id" | "name" | "exposure">) {
  return drizzleClient
    .update(device)
    .set({ name: name, exposure: exposure })
    .where(eq(device.id, id));
  // return prisma.device.update({
  //   where: { id },
  //   data: {
  //     name: name,
  //     exposure: exposure,
  //   },
  // });
}

export function updateDeviceLocation({
  id,
  latitude,
  longitude,
}: Pick<Device, "id" | "latitude" | "longitude">) {
  return drizzleClient
    .update(device)
    .set({ latitude: latitude, longitude: longitude })
    .where(eq(device.id, id));
  // return prisma.device.update({
  //   where: { id },
  //   data: {
  //     latitude: latitude,
  //     longitude: longitude,
  //   },
  // });
}

export function deleteDevice({ id }: Pick<Device, "id">) {
  return drizzleClient.delete(device).where(eq(device.id, id));
}

export function getUserDevices(userId: Device["userId"]) {
  return drizzleClient.query.device.findMany({
    where: (device, { eq }) => eq(device.userId, userId),
    columns: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      exposure: true,
      model: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getDevices() {
  // const opts = {
  //   open: '{"type":"FeatureCollection","features":[',
  //   close: "]}",
  //   geoJsonStringifyReplacer,
  // };
  const devices = await drizzleClient.query.device.findMany({
    columns: {
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

export async function getDevicesWithSensors() {
  // const devices = await drizzleClient.query.device.findMany({
  //   columns: {
  //     id: true,
  //     name: true,
  //     latitude: true,
  //     longitude: true,
  //     exposure: true,
  //     createdAt: true,
  //     status: true,
  //   },
  //   with: {
  //     sensors: true
  //   }
  // })

  const rows = await drizzleClient
    .select({
      device: device,
      sensor: {
        id: sensor.id,
        title: sensor.title,
        sensorWikiPhenomenon: sensor.sensorWikiPhenomenon,
        lastMeasurement: sensor.lastMeasurement,
      },
    })
    .from(device)
    .leftJoin(sensor, eq(sensor.deviceId, device.id));
  const geojson: GeoJSON.FeatureCollection<Point, any> = {
    type: "FeatureCollection",
    features: [],
  };

  // const result = rows.reduce<Record<string, { device: Device; sensors: Sensor[] }>>(
  //   (acc, row) => {
  //     const device = row.device;
  //     const sensor = row.sensor;

  //     if (!acc[device.id]) {
  //       acc[device.id] = { device, sensors: [] };
  //     }

  //     if (sensor) {
  //       acc[device.id].sensors.push(sensor);
  //     }

  //     return acc;
  //   },
  //   {},
  // );

  // const result = rows.reduce<Record<string, { device: Device & { sensors: Sensor[] } }>>(
  //   (acc, row) => {
  //     const device = row.device;
  //     const sensor = row.sensor;

  //     if (!acc[device.id]) {
  //       acc[device.id] = { device: { ...device, sensors: [] } };
  //     }

  //     if (sensor) {
  //       acc[device.id].device.sensors.push(sensor);
  //     }

  //     return acc;
  //   },
  //   {},
  // );

  type PartialSensor = Pick<
    Sensor,
    "id" | "title" | "sensorWikiPhenomenon" | "lastMeasurement"
  >;
  const deviceMap = new Map<
    string,
    { device: Device & { sensors: PartialSensor[] } }
  >();

  const resultArray: Array<{ device: Device & { sensors: PartialSensor[] } }> =
    rows.reduce(
      (acc, row) => {
        const device = row.device;
        const sensor = row.sensor;

        if (!deviceMap.has(device.id)) {
          const newDevice = {
            device: { ...device, sensors: sensor ? [sensor] : [] },
          };
          deviceMap.set(device.id, newDevice);
          acc.push(newDevice);
        } else if (sensor) {
          deviceMap.get(device.id)!.device.sensors.push(sensor);
        }

        return acc;
      },
      [] as Array<{ device: Device & { sensors: PartialSensor[] } }>,
    );

  // const resultObj = Object.entries(result)

  // console.log(resultObj)

  // for (const [, value] of resultObj) {
  //   const coordinates = [value.device.longitude, value.device.latitude];
  //   const feature = point(coordinates, value);
  //   geojson.features.push(feature);
  // }

  for (const device of resultArray) {
    const coordinates = [device.device.longitude, device.device.latitude];
    const feature = point(coordinates, device.device);
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
  const newDevice = await drizzleClient
    .insert(device)
    .values({
      id: deviceData._id,
      sensorWikiModel: formDeviceData.type,
      userId: userId ?? "unknown",
      name: deviceData.name,
      exposure: deviceData.exposure,
      useAuth: deviceData.useAuth,
      latitude: Number(deviceData.currentLocation.coordinates[1]),
      longitude: Number(deviceData.currentLocation.coordinates[0]),
    })
    .returning();

  for await (let [i, sensor] of deviceData.sensors.entries()) {
    await drizzleClient.insert(sensor).values({
      id: sensor._id,
      deviceId: newDevice[0].id,
      title: sensorArray[i].name,
      sensorType: sensor.sensorType,
      unit: sensor.unit,
      sensorWikiType: sensor.sensorType,
      sensorWikiUnit: sensor.unit,
      sensorWikiPhenomenon: sensor.title,
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
