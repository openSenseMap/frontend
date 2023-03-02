import { useState } from "react";
import SingleValue from "./SingleValue";
import { XCircleIcon, MinusCircleIcon, ChevronDoubleUpIcon } from "@heroicons/react/24/solid";
import { Link } from "@remix-run/react";

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
    <div>
      <div className={"bg-white " + (isOpen ? "animate-fade-in-up" : "hidden")}>
        <div className="flex">
          <div className="text-l basis-1/4 bg-green-300 pt-6 pb-6 text-center font-bold text-green-900 lg:text-3xl">
            <p>{device.name}</p>
          </div>
          <div className="grid basis-3/4 content-center bg-green-900 pr-2 text-right text-sm text-white">
            <div>
              <p className="text-xs lg:inline lg:text-sm">Letzte Messung:</p>
              <p className="text-xs lg:inline lg:text-sm">
                {" "}
                {device.lastUpdate}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-green-900 pr-2">
            <MinusCircleIcon
              onClick={() => {
                setIsOpen(!isOpen);
              }}
              className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8"
            />
          </div>
          <div className="flex items-center bg-green-900 pr-2">
            <Link prefetch="intent" to="/explore">
              <XCircleIcon className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8" />
            </Link>
          </div>
        </div>
        <div className="flex justify-center overflow-auto">
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
      <div
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={
          "absolute bottom-5 left-1/2 cursor-pointer rounded-full bg-white p-2 hover:animate-bounce " +
          (!isOpen ? "visible" : "hidden")
        }
      >
        <ChevronDoubleUpIcon className="h-6 w-6 text-green-900" />
      </div>
    </div>
  );
}
