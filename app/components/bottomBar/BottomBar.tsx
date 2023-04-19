import { useEffect, useRef, useState } from "react";
import {
  XCircleIcon,
  MinusCircleIcon,
  ChevronDoubleUpIcon,
} from "@heroicons/react/24/solid";
import { Form, Link, useSearchParams, useSubmit } from "@remix-run/react";
import Graph from "./Graph";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";

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
  const [searchParams] = useSearchParams();
  const [toastOpen, setToastOpen] = useState(false);
  const submit = useSubmit();
  const sensorIds = searchParams.getAll("sensorId");
  const timerRef = useRef<number>(0);

  useEffect(() => {
    var timer = timerRef.current;
    return () => clearTimeout(timer);
  }, []);

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
      <ToastPrimitive.Provider>
        <div
          className={"bg-white " + (isOpen ? "animate-fade-in-up" : "hidden")}
        >
          <div className="flex">
            <div className="text-l basis-1/4 bg-green-100 pt-6 pb-6 text-center font-bold dark:bg-green-200 lg:text-3xl">
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
            onChange={(e) => {
              submit(e.currentTarget);
            }}
          >
            {device.sensors.map((sensor) => (
              <div
                className="p-4"
                key={sensor._id}
                onClick={() => {
                  if (
                    !sensorIds.includes(sensor._id) &&
                    searchParams.getAll("sensorId").length >= 2
                  ) {
                    if (toastOpen) {
                      setToastOpen(false);
                      setTimeout(() => {
                        setToastOpen(true);
                      }, 300);
                    } else {
                      setToastOpen(true);
                    }
                  }
                }}
              >
                <label
                  htmlFor={sensor._id}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <input
                    className="peer hidden"
                    disabled={
                      !sensorIds.includes(sensor._id) &&
                      searchParams.getAll("sensorId").length >= 2
                        ? true
                        : false
                    } // check if there are already two selected and this one is not one of them
                    type="checkbox"
                    name="sensorId"
                    id={sensor._id}
                    value={sensor._id}
                    defaultChecked={sensorIds.includes(sensor._id)}
                  />
                  <div className="block rounded-lg border-2 p-4 peer-checked:border-green-100">
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
          <ChevronDoubleUpIcon className="text-green-900 h-6 w-6" />
        </div>
        <ToastPrimitive.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          className={clsx(
            "fixed inset-x-4 bottom-4 z-50 w-auto rounded-lg shadow-lg md:top-4 md:right-4 md:left-auto md:bottom-auto md:w-full md:max-w-sm",
            "dark:bg-gray-800 bg-white",
            "radix-state-open:animate-toast-slide-in-bottom md:radix-state-open:animate-toast-slide-in-right",
            "radix-state-closed:animate-toast-hide",
            "radix-swipe-direction-right:radix-swipe-end:animate-toast-swipe-out-x",
            "radix-swipe-direction-right:translate-x-radix-toast-swipe-move-x",
            "radix-swipe-direction-down:radix-swipe-end:animate-toast-swipe-out-y",
            "radix-swipe-direction-down:translate-y-radix-toast-swipe-move-y",
            "radix-swipe-cancel:translate-x-0 radix-swipe-cancel:duration-200 radix-swipe-cancel:ease-[ease]",
            "focus-visible:ring-purple-500 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75"
          )}
        >
          <div className="flex">
            <div className="flex w-0 flex-1 items-center py-4 pl-5">
              <div className="radix w-full">
                <ToastPrimitive.Title className="text-gray-900 text-sm font-medium dark:text-gray-100">
                  Too many sensors selected
                </ToastPrimitive.Title>
                <ToastPrimitive.Description className="text-gray-700 mt-1 text-sm dark:text-gray-400">
                  Please unselect a sensor before selecting a new one.
                </ToastPrimitive.Description>
              </div>
            </div>
          </div>
        </ToastPrimitive.Root>
        <ToastPrimitive.Viewport />
      </ToastPrimitive.Provider>
    </div>
  );
}
