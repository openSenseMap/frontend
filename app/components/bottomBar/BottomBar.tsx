import { useState } from "react";
import SingleValue from "./SingleValue";

interface BottomBarProps {
  id: string;
  name: string;
  sensors: Array<SensorProps>;
  lastUpdate: string;
}

interface SensorProps {
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

export default function BottomBar(device: BottomBarProps) {
  const [isOpen, setIsOpen] = useState<Boolean>(true);
  return (
    <div
      className={
        "bg-white " + (isOpen ? "animate-fade-in-up" : "hidden")
      }
    >
      <div className="flex">
        <div className="basis-1/4 bg-green-300 pt-2 pb-2 pl-4 pr-4 text-center text-xl font-bold text-green-900">
          <p>{device.name}</p>
        </div>
        <div className="grid basis-3/4 content-center bg-green-900 pr-2 text-right text-sm text-white">
          <div>
            <p className="inline">Letzte Messung: {device.lastUpdate}</p>
            <strong
              className="inline cursor-pointer pl-2 text-xl"
              onClick={() => {
                console.log(isOpen);
                
                setIsOpen(false);
              }}
            >
              &times;
            </strong>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        {device.sensors.map((sensor: SensorProps) => {
          return (
            <SingleValue
              key={sensor._id}
              _id={sensor._id}
              icon={sensor.icon}
              sensorType={sensor.sensorType}
              title={sensor.title}
              unit={sensor.unit}
              lastMeasurement={sensor.lastMeasurement}
            />
          );
        })}
      </div>
    </div>
  );
}
