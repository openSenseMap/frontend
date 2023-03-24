import { useState } from "react";
import {
  XCircleIcon,
  MinusCircleIcon,
  ChevronDoubleUpIcon,
} from "@heroicons/react/24/solid";
import { Form, Link, useSearchParams, useSubmit } from "@remix-run/react";
import Graph from "./Graph";

interface BottomBarProps {
  id: string;
  name: string;
  sensors: Array<SensorProps>;
  lastUpdate: string;
  location: [number, number];
  selectedSensors: Array<SensorProps>;
}

export interface SensorProps {
  _id: string;
  icon: string;
  lastMeasurement: LastMeasurementProps;
  sensorType: string;
  title: string;
  unit: string;
}

export interface LastMeasurementProps {
  createdAt: string;
  value: string;
}

export default function BottomBar(device: BottomBarProps) {
  const [isOpen, setIsOpen] = useState<Boolean>(true);

  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const sensorIds = searchParams.getAll("sensorId");

  function filterSensorsById(
    idArray: string[],
    objectArray: SensorProps[]
  ): SensorProps[] {
    const filteredArray: SensorProps[] = [];

    for (const obj of objectArray) {
      if (idArray.includes(obj._id)) {
        filteredArray.push(obj);
      }
    }

    return filteredArray;
  }

  return (
    <div>
      <div className={"bg-white " + (isOpen ? "animate-fade-in-up" : "hidden")}>
        <div className="flex">
          <div className="text-l basis-1/4 bg-green-100 dark:bg-green-200 pt-6 pb-6 text-center font-bold lg:text-3xl">
            <p>{device.name}</p>
          </div>
          <div className="grid basis-3/4 content-center bg-green-100 pr-2 text-right text-sm text-white">
            <div>
              <p className="text-xs lg:inline lg:text-sm">Letzte Messung:</p>
              <p className="text-xs lg:inline lg:text-sm">
                {" " + device.lastUpdate}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-green-100 pr-2">
            <MinusCircleIcon
              onClick={() => {
                setIsOpen(!isOpen);
              }}
              className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8"
            />
          </div>
          <div className="flex items-center bg-green-100 pr-2">
            <Link prefetch="intent" to="/explore">
              <XCircleIcon className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8" />
            </Link>
          </div>
        </div>
        <Form
          method="get"
          className="flex justify-center overflow-auto"
          onChange={(e) => submit(e.currentTarget)}
        >
          {device.sensors.map((sensor) => (
            <div className="p-4" key={sensor._id}>
              <label
                htmlFor={sensor._id}
                className="flex cursor-pointer items-center justify-between"
              >
                <input
                  className="peer hidden"
                  type="checkbox"
                  name="sensorId"
                  id={sensor._id}
                  value={sensor._id}
                  defaultChecked={sensorIds.includes(sensor._id)}
                />
                <div className="block peer-checked:border-green-100 rounded-lg border-2 p-4">
                  <div className="flex justify-center">
                    {sensor.lastMeasurement ? (
                      <b>{sensor.lastMeasurement.value}</b>
                    ) : (
                      <b>xx</b>
                    )}
                    <p>{sensor.unit}</p>
                  </div>
                  <p className="text-sm lg:text-xl">{sensor.title}</p>
                </div>
              </label>
            </div>
          ))}
        </Form>
        {sensorIds.length > 0 ? (
          <Graph sensors={filterSensorsById(sensorIds, device.sensors)} />
        ) : null}
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
