import { DeviceWithoutSensors, getDeviceWithoutSensors, getDevice, findAccessToken } from "~/models/device.server";
import { getSensorsWithLastMeasurement, getSensorWithLastMeasurement } from "~/models/sensor.server";
import { SensorWithLatestMeasurement } from "~/schema";
import { decodeMeasurements, hasDecoder } from "~/lib/decoding-service.server";
import { saveMeasurements } from "~/models/measurement.server";

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

interface PostMeasurementsOptions {
  contentType: string;
  luftdaten: boolean;
  hackair: boolean;
  authorization?: string | null;
}

interface SingleMeasurementBody {
  value: number;
  createdAt?: string;
  location?: [number, number, number] | { lat: number; lng: number; height?: number };
}

interface LocationData {
  lng: number;
  lat: number;
  height?: number;
}

const normalizeLocation = (location: SingleMeasurementBody['location']): LocationData | null => {
  if (!location) return null;
  
  if (Array.isArray(location)) {
    if (location.length < 2) return null;
    return {
      lng: location[0],
      lat: location[1],
      height: location[2],
    };
  }
  
  if (typeof location === 'object' && 'lat' in location && 'lng' in location) {
    return {
      lng: location.lng,
      lat: location.lat,
      height: location.height,
    };
  }
  
  return null;
};

const validateLocationCoordinates = (loc: LocationData): boolean => {
  return loc.lng >= -180 && loc.lng <= 180 && 
         loc.lat >= -90 && loc.lat <= 90;
};

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

  if (device.useAuth) {
    const deviceAccessToken = await findAccessToken(deviceId);
    
    if (deviceAccessToken?.token && deviceAccessToken.token !== authorization) {
      const error = new Error("Device access token not valid!");
      error.name = "UnauthorizedError";
      throw error;
    }
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

    if (device.useAuth) {
      const deviceAccessToken = await findAccessToken(deviceId);
      
      if (deviceAccessToken?.token && deviceAccessToken.token !== authorization) {
        const error = new Error("Device access token not valid!");
        error.name = "UnauthorizedError";
        throw error;
      }
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

    let locationData: LocationData | null = null;
    if (body.location) {
      locationData = normalizeLocation(body.location);
      
      if (locationData && !validateLocationCoordinates(locationData)) {
        const error = new Error("Invalid location coordinates");
        error.name = "UnprocessableEntityError";
        throw error;
      }
    }

    const measurements = [{
      sensor_id: sensorId,
      value: body.value,
      createdAt: timestamp,
      location: locationData,
    }];

    await saveMeasurements(device, measurements);
  } catch (error) {
    if (error instanceof Error && 
        ['UnauthorizedError', 'NotFoundError', 'UnprocessableEntityError'].includes(error.name)) {
      throw error;
    }
        
    console.error('Error in postSingleMeasurement:', error);
    throw error;
  }
};