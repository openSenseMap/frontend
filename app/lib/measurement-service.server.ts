import { DeviceWithoutSensors, getDeviceWithoutSensors } from "~/models/device.server";
import { getSensorsWithLastMeasurement, getSensorWithLastMeasurement } from "~/models/sensor.server";
import { SensorWithLatestMeasurement } from "~/schema";

export type DeviceWithSensors = DeviceWithoutSensors & {sensors: SensorWithLatestMeasurement[]}

export async function getLatestMeasurementsForSensor(boxId: string, sensorId: string, count?: number):
  Promise<SensorWithLatestMeasurement | null> {

  const device: DeviceWithoutSensors = await getDeviceWithoutSensors({ id: boxId });
  if (!device) return null;

  // single sensor, no need for having info about device
  return await getSensorWithLastMeasurement(device.id, sensorId, count);
}

/**
 *
 * @param boxId
 * @param sensorId
 * @param count
 */
export async function getLatestMeasurements (
  boxId: string,
  count?: number,
): Promise<DeviceWithSensors | null> {
  const device: DeviceWithoutSensors = await getDeviceWithoutSensors({ id: boxId });
  if (!device) return null;

  const sensorsWithMeasurements = await getSensorsWithLastMeasurement(
    device.id, count);

  const deviceWithSensors: DeviceWithSensors = device as DeviceWithSensors
  deviceWithSensors.sensors = sensorsWithMeasurements;
  return deviceWithSensors;
};
