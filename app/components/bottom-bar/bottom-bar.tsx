import { useState } from "react";
import {
  XCircleIcon,
  MinusCircleIcon,
  ChevronDoubleUpIcon,
} from "@heroicons/react/24/solid";
import {
  Form,
  Link,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import Graph from "./graph";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";
import type { Prisma, Sensor } from "@prisma/client";
import type { DeviceWithSensors } from "types";
import Spinner from "../spinner";

export interface LastMeasurementProps {
  createdAt: Date;
  value: string;
}

export interface DeviceAndSelectedSensors {
  device: DeviceWithSensors;
  selectedSensors: Sensor[];
}

export default function BottomBar(data: DeviceAndSelectedSensors) {
  const navigation = useNavigation();
  // state variables
  const [isOpen, setIsOpen] = useState<Boolean>(true);
  const [searchParams] = useSearchParams();
  const [toastOpen, setToastOpen] = useState(false);

  // form submission handler
  const submit = useSubmit();

  // get list of selected sensor ids from URL search params
  const sensorIds = searchParams.getAll("sensor");

  // helper function to filter an array of sensors by their ids
  function filterSensorsById(
    idArray: string[],
    objectArray: Sensor[]
  ): Sensor[] {
    const filteredArray: Sensor[] = [];

    for (const obj of objectArray) {
      if (idArray.includes(obj.id)) {
        filteredArray.push(obj);
      }
    }
    return filteredArray;
  }

  // helper function to format a date as a string
  const formattedDate = (date: Date) => {
    return new Date(date).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div>
      <ToastPrimitive.Provider>
        <div
          className={"bg-white " + (isOpen ? "animate-fade-in-up" : "hidden")}
        >
          <div className="flex">
            <div className="text-l dark:bg-green-200 basis-1/4 bg-green-100 pt-6 pb-6 text-center font-bold lg:text-3xl">
              <p>{data.device.name}</p>
            </div>
            <div className="grid basis-3/4 content-center bg-green-100 pr-2 text-right text-sm text-white">
              <div>
                <p className="text-xs lg:inline lg:text-sm">Letzte Messung: </p>
                <p className="text-xs lg:inline lg:text-sm">
                  {formattedDate(data.device.updatedAt)}
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
          <div className="relative">
            {navigation.state === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
                <Spinner />
              </div>
            )}
            <Form
              method="get"
              onChange={(e) => {
                submit(e.currentTarget);
              }}
              className={
                navigation.state === "loading" ? "pointer-events-none" : ""
              }
            >
              <div
                className={
                  "-ms-overflow-style:none scrollable box-border w-full overflow-x-auto overflow-y-hidden"
                }
              >
                <div className="flex justify-center whitespace-nowrap text-center">
                  {data.device.sensors.map((sensor: Sensor) => {
                    // dont really know why this is necessary - some kind of TypeScript/i18n bug?
                    const lastMeasurement =
                      sensor.lastMeasurement as Prisma.JsonObject;
                    const value = lastMeasurement.value as string;
                    return (
                      <div
                        key={sensor.id}
                        onClick={() => {
                          if (
                            !sensorIds.includes(sensor.id) &&
                            searchParams.getAll("sensor").length >= 2
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
                        <label htmlFor={sensor.id}>
                          <input
                            className="peer hidden"
                            disabled={
                              !sensorIds.includes(sensor.id) &&
                              searchParams.getAll("sensor").length >= 2
                                ? true
                                : false
                            } // check if there are already two selected and this one is not one of them
                            type="checkbox"
                            name="sensor"
                            id={sensor.id}
                            value={sensor.id}
                            defaultChecked={sensorIds.includes(sensor.id)}
                          />
                          <div
                            className={
                              "whitespace-nowrap" +
                              (sensorIds.includes(sensor.id)
                                ? " text-green-100"
                                : "")
                            }
                          >
                            <div
                              className={
                                "w-220 min-w-150 relative flex flex-grow-0 flex-col items-center justify-center border-l border-r border-gray-300 py-2 px-6 hover:cursor-pointer hover:bg-gray-100"
                              }
                            >
                              <div>
                                <div className="flex h-8 items-center justify-center">
                                  <div className="text-4xl">
                                    {sensor.lastMeasurement ? (
                                      <>
                                        <b>{value.split(".")[0]}</b>
                                        <span className="pl-[0.1rem] text-[0.35rem]">
                                          <span>
                                            {value.split(".")[1] || "00"}
                                          </span>
                                        </span>
                                      </>
                                    ) : (
                                      <b className="text-xs opacity-80">n/a</b>
                                    )}
                                  </div>
                                  {sensor.unit && sensor.lastMeasurement && (
                                    <div className="relative left-[-10px] self-start text-sm font-bold">
                                      {sensor.unit}
                                    </div>
                                  )}
                                </div>
                                <div className="text-center">
                                  {sensor.title}
                                </div>
                              </div>
                              {sensorIds.length >= 2 &&
                              !sensorIds.includes(sensor.id) ? null : (
                                <div className="absolute bottom-[5px] right-[5px] flex items-center justify-center p-1 text-2xl">
                                  {sensorIds.includes(sensor.id) ? (
                                    <div className="h-3 w-3 cursor-pointer rounded leading-3">
                                      -
                                    </div>
                                  ) : (
                                    <div className="h-3 w-3 cursor-pointer rounded leading-3">
                                      +
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Form>
            {sensorIds.length > 0 ? <Graph /> : null}
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
        <ToastPrimitive.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          className={clsx(
            "fixed inset-x-4 bottom-4 z-50 w-auto rounded-lg shadow-lg md:top-4 md:right-4 md:left-auto md:bottom-auto md:w-full md:max-w-sm",
            "bg-white dark:bg-gray-800",
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
                <ToastPrimitive.Title className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Too many sensors selected
                </ToastPrimitive.Title>
                <ToastPrimitive.Description className="mt-1 text-sm text-gray-700 dark:text-gray-400">
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
