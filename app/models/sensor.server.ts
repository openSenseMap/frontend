import { eq } from "drizzle-orm";
import { sensor, type InsertSensor, type SelectSensor } from "db/schema";
import { drizzleClient } from "~/db.server";

export function getSensors(deviceId: SelectSensor["deviceId"]) {
  return drizzleClient.query.sensor.findMany({
    where: (sensor, { eq }) => eq(sensor.deviceId, deviceId),
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

export function deleteSensor(id: SelectSensor["id"]) {
  return drizzleClient.delete(sensor).where(eq(sensor.id, id));
}
