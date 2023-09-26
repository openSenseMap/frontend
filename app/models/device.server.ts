import { drizzleClient } from "~/db.server";

import { point } from "@turf/helpers";
import type { Point } from "geojson";
import { eq } from "drizzle-orm";
import { device, type SelectDevice } from "db/schema";

export function getDevice({ id }: Pick<SelectDevice, "id">) {
  return drizzleClient.query.device.findFirst({
    where: (device, { eq }) => eq(device.id, id),
    columns: {
      id: true,
      name: true,
      description: true,
      exposure: true,
      status: true,
      updatedAt: true,
      latitude: true,
      longitude: true,
      useAuth: true,
      public: true,
      createdAt: true,
      userId: true,
    },
    with: {
      sensors: true,
    },
  });
}

export function getDeviceWithoutSensors({ id }: Pick<SelectDevice, "id">) {
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
}: Pick<SelectDevice, "id" | "name" | "exposure">) {
  return drizzleClient
    .update(device)
    .set({
      name: name,
      exposure: exposure,
    })
    .where(eq(device.id, id));
}

export function updateDeviceLocation({
  id,
  latitude,
  longitude,
}: Pick<SelectDevice, "id" | "latitude" | "longitude">) {
  return drizzleClient
    .update(device)
    .set({
      latitude,
      longitude,
    })
    .where(eq(device.id, id));
}

export function deleteDevice({ id }: Pick<SelectDevice, "id">) {
  return drizzleClient.delete(device).where(eq(device.id, id));
}

export function getUserDevices(userId: SelectDevice["userId"]) {
  // TODO: where clause
  return drizzleClient.query.device.findMany({
    where: (device, { eq }) => eq(device.userId, userId),
    columns: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      exposure: true,
      createdAt: true,
      updatedAt: true,
      // userId: true,
    },
  });
}

export async function getDevices() {
  const devices = await drizzleClient.query.device.findMany();
  const geojson: GeoJSON.FeatureCollection<Point> = {
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
