import type { Measurement } from "./measurement.server";

export type Sensor = {
  _id: string;
  title: string;
  unit: string;
  sensorType?: string;
  icon?: string;
};

export type SensorWithRef = Sensor & { lastMeasurement: string };
export type SensorWithMeasurement = Sensor & { lastMeasurment: Measurement };
