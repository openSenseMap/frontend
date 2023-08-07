import type { Device, Sensor } from "@prisma/client";
import { prisma } from "~/db.server";

export function getSensors(deviceId: Sensor["deviceId"]) {
  return prisma.sensor.findMany({
    select: {
      id: true,
      title: true,
      unit: true,
      sensorType: true,
      icon: true
    },
    where: { deviceId },
  });
}

export function addNewSensor({
  title,
  unit,
  sensorType,
  deviceId
}: Pick<Sensor, "title" | "unit" | "sensorType" |"deviceId">) {
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
