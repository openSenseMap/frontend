export type Sensor = {
  _id: string;
  title: string;
  unit: string;
  sensorType?: string;
  icon?: string;
  lastMeasurement: any;
}