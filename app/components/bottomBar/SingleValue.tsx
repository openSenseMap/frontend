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
    <div className="border-grey-300 lg:mb-3 mt-3 flex-1 border-r border-l border-solid pl-3 pr-3 text-center text-l lg:text-2xl">
      <div className="flex justify-center">
        {sensor.lastMeasurement ? (<b>{sensor.lastMeasurement.value}</b>) : (<b>xx</b>)}
        <p>{sensor.unit}</p>
      </div>
      <p className="text-sm lg:text-xl">{sensor.title}</p>
    </div>
  );
}
