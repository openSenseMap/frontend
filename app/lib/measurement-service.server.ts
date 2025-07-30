import { getDeviceWithoutSensors } from "~/models/device.server";
import { getSensorsWithLastMeasurement } from "~/models/sensor.server";

/**
 *
 * @param boxId
 * @param sensorId
 * @param count
 */
export const getLatestMeasurements = async (
  boxId: string,
  sensorId: string | undefined,
  count: number | undefined,
): Promise<any | null> => {
  const device = await getDeviceWithoutSensors({ id: boxId });
  if (!device) return null;

  const sensorsWithMeasurements = await getSensorsWithLastMeasurement(
    device.id,
    sensorId,
    count,
  );
  if (sensorId !== undefined) return sensorsWithMeasurements; // single sensor, no need for having info about device

  (device as any).sensors = sensorsWithMeasurements;
  return device;
};
