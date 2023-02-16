interface SingleValueProps {
  _id: string;
  icon: string;
  lastMeasurement: LastMeasurementProps;
  sensorType: string;
  title: string;
  unit: string;
}

interface LastMeasurementProps {
  createdAt: string;
  value: string;
}

export default function SingleValue(sensor: SingleValueProps) {
  return (
    <div className="border-grey-300 mb-3 mt-3 flex-1 border-r border-l border-solid pl-3 pr-3 text-center text-2xl">
      <div className="flex justify-center">
        <b>{sensor.lastMeasurement.value}</b>
        <p>{sensor.unit}</p>
      </div>
      <p className="">{sensor.title}</p>
    </div>
  );
}
