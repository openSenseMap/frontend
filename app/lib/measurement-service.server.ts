import { getDevice, getDeviceWithoutSensors } from "~/models/device.server";
import { getSensorsWithLastMeasurement } from "~/models/sensor.server";
import { type Device } from "~/schema";

/**
 *
 * @param boxId
 * @param sensorId
 * @param count
 */
export const getLatestMeasurements = async (
  boxId: string,
  sensorId: number | undefined,
  count: number | undefined,
): Promise<any | null> => {
  const device = await getDeviceWithoutSensors({ id: boxId });
  if (!device) return null;

  const sensorsWithMeasurements = await getSensorsWithLastMeasurement(
    device.id,
    count,
  );
  (device as any).sensors = sensorsWithMeasurements;

  return device;
};
