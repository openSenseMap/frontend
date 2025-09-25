import { getDevice, findAccessToken, getDevicesWithSensors } from "~/models/device.server";
import { saveMeasurements } from "~/models/measurement.server";
import { decodeMeasurements, hasDecoder } from "~/lib/decoding-service.server";

interface PostMeasurementsOptions {
  contentType: string;
  luftdaten: boolean;
  hackair: boolean;
  authorization?: string | null;
}

export const postNewMeasurements = async (
  deviceId: string,
  body: any,
  options: PostMeasurementsOptions,
): Promise<void> => {
  const { luftdaten, hackair, authorization } = options;
  let { contentType } = options;

  // Override content type based on query parameters
  if (hackair) {
    contentType = "hackair";
  } else if (luftdaten) {
    contentType = "luftdaten";
  }

  if (!hasDecoder(contentType)) {
    throw new Error("UnsupportedMediaTypeError: Unsupported content-type.");
  }

  // Get device with sensors
  const device = await getDevice({id: deviceId});
  if (!device) {
    throw new Error("NotFoundError: Device not found");
  }

  // Get device access token
  const deviceAccessToken = await findAccessToken(deviceId);

  // Authorization check for boxes that have auth enabled or hackair format
  if (
    (contentType === "hackair") &&
    deviceAccessToken?.token &&
    deviceAccessToken.token !== authorization
  ) {
    const error = new Error("Device access token not valid!");
    error.name = "UnauthorizedError";
    throw error;
  }

  // Decode measurements based on content type and sensors
  const measurements = await decodeMeasurements(body, {
    contentType,
    sensors: device.sensors,
  });

  await saveMeasurements(device, measurements);
};