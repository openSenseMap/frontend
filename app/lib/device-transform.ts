import { type Device, type Sensor } from '~/schema';

export type DeviceWithSensors = Device & {
  sensors: Sensor[];
};

export type TransformedDevice = {
  _id: string;
  name: string;
  description: string | null;
  image: string | null;
  link: string | null;
  grouptag: string[];
  exposure: string | null;
  model: string | null;
  latitude: number;
  longitude: number;
  useAuth: boolean | null;
  public: boolean | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  userId: string;
  sensorWikiModel?: string | null;
  currentLocation: {
    type: "Point";
    coordinates: number[];
    timestamp: string;
  };
  lastMeasurementAt: string;
  loc: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: number[];
      timestamp: string;
    };
  }>;
  integrations: {
    mqtt: {
      enabled: boolean;
    };
  };
  access_token: string;
  sensors: Array<{
    _id: string;
    title: string | null;
    unit: string | null;
    sensorType: string | null;
    lastMeasurement: {
      value: string;
      createdAt: string;
    } | null;
  }>;
};

/**
 * Transforms a device with sensors from database format to openSenseMap API format
 * @param box - Device object with sensors from database
 * @param jwtString - JWT token to include as access_token
 * @returns Transformed device in openSenseMap API format
 * 
 * Note: Converts lastMeasurement.value from number to string to match API specification
 */
export function transformDeviceToApiFormat(
  box: DeviceWithSensors,
  jwtString: string
): TransformedDevice {
  const { id, tags, sensors, ...rest } = box;
  const timestamp = box.updatedAt.toISOString();
  const coordinates = [box.longitude, box.latitude];
  
  return {
    _id: id,
    grouptag: tags || [],
    access_token: jwtString,
    ...rest,
    currentLocation: {
      type: "Point",
      coordinates,
      timestamp
    },
    lastMeasurementAt: timestamp,
    loc: [{
      geometry: { type: "Point", coordinates, timestamp },
      type: "Feature"
    }],
    integrations: { mqtt: { enabled: false } },
    sensors: sensors?.map((sensor) => ({
      _id: sensor.id,
      title: sensor.title,
      unit: sensor.unit,
      sensorType: sensor.sensorType,
      lastMeasurement: sensor.lastMeasurement 
        ? {
            createdAt: sensor.lastMeasurement.createdAt,
            // Convert numeric values to string to match API specification
            value: typeof sensor.lastMeasurement.value === 'number' 
              ? String(sensor.lastMeasurement.value) 
              : sensor.lastMeasurement.value,
          }
        : null,
    })) || [],
  };
}
