import { decodeMeasurements, hasDecoder } from "~/lib/decoding-service.server";
import { getDeviceWithoutSensors, getDevice, findAccessToken } from "~/models/device.server";
import { saveMeasurements } from "~/models/measurement.server";
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

interface PostMeasurementsOptions {
  contentType: string;
  luftdaten: boolean;
  hackair: boolean;
  authorization?: string | null;
}

interface SingleMeasurementBody {
  value: number;
  createdAt?: string;
}

export const postNewMeasurements = async (
  deviceId: string,
  body: any,
  options: PostMeasurementsOptions,
): Promise<void> => {
  const { luftdaten, hackair, authorization } = options;
  let { contentType } = options;

  if (hackair) {
    contentType = "hackair";
  } else if (luftdaten) {
    contentType = "luftdaten";
  }

  if (!hasDecoder(contentType)) {
    throw new Error("UnsupportedMediaTypeError: Unsupported content-type.");
  }

  const device = await getDevice({id: deviceId});
  if (!device) {
    throw new Error("NotFoundError: Device not found");
  }

  const deviceAccessToken = await findAccessToken(deviceId);

  if (
    (contentType === "hackair") &&
    deviceAccessToken?.token &&
    deviceAccessToken.token !== authorization
  ) {
    const error = new Error("Device access token not valid!");
    error.name = "UnauthorizedError";
    throw error;
  }

  const measurements = await decodeMeasurements(body, {
    contentType,
    sensors: device.sensors,
  });

  await saveMeasurements(device, measurements);
};

export const postSingleMeasurement = async (
  deviceId: string,
  sensorId: string,
  body: SingleMeasurementBody,
  authorization?: string | null,
): Promise<void> => {
  try {
    if (typeof body.value !== 'number' || isNaN(body.value)) {
      const error = new Error("Invalid measurement value");
      error.name = "UnprocessableEntityError";
      throw error;
    }

    const device = await getDevice({ id: deviceId });
    
    if (!device) {
      const error = new Error("Device not found");
      error.name = "NotFoundError";
      throw error;
    }

    const sensor = device.sensors?.find((s: any) => s.id === sensorId);
    if (!sensor) {
      const error = new Error("Sensor not found on device");
      error.name = "NotFoundError";
      throw error;
    }

    const deviceAccessToken = await findAccessToken(deviceId);
    if (deviceAccessToken?.token && deviceAccessToken.token !== authorization) {
      const error = new Error("Device access token not valid!");
      error.name = "UnauthorizedError";
      throw error;
    }

    let timestamp: Date | undefined;
    if (body.createdAt) {
      timestamp = new Date(body.createdAt);
      
      if (isNaN(timestamp.getTime())) {
        const error = new Error("Invalid timestamp format");
        error.name = "UnprocessableEntityError";
        throw error;
      }
    }

    // Create measurement object matching the format expected by saveMeasurements
    // Note: createdAt can be undefined (will use current time) or a Date object
    const measurements = [{
      sensor_id: sensorId,
      value: body.value,
      createdAt: timestamp,
    }];

    await saveMeasurements(device, measurements);
  } catch (error) {
    // Re-throw errors that already have proper names
    if (error instanceof Error && 
        ['UnauthorizedError', 'NotFoundError', 'UnprocessableEntityError'].includes(error.name)) {
      throw error;
    }
    
    console.error('Error in postSingleMeasurement:', error);
    throw error;
  }
};