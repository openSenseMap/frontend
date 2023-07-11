// import { useState } from "react";
import {
  Form,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import Graph from "./graph";
import type { Prisma, Sensor } from "@prisma/client";
import type { DeviceWithSensors } from "types";
import Spinner from "../spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

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
  // const [isOpen, setIsOpen] = useState<Boolean>(true);
  const [searchParams] = useSearchParams();
  // const [toastOpen, setToastOpen] = useState(false);

  // form submission handler
  const submit = useSubmit();

  // get list of selected sensor ids from URL search params
  const sensorIds = searchParams.getAll("sensor");

  // helper function to format a date as a string
  // const formattedDate = (date: Date) => {
  //   return new Date(date).toLocaleString("de-DE", {
  //     day: "2-digit",
  //     month: "2-digit",
  //     year: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     second: "2-digit",
  //   });
  // };

  return (
    <>
      <div className="shadow-zinc-800/[.05] ring-zinc-900/[.5] dark:bg-zinc-800/[.3] dark:ring-white/10 absolute bottom-28 left-4 right-4 top-6 z-40 flex w-auto flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 backdrop-blur-sm dark:text-zinc-200 sm:bottom-6 sm:left-6 sm:right-auto sm:top-24 sm:max-h-[calc(100vh-8rem)] sm:w-1/4">
        {navigation.state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
            <Spinner />
          </div>
        )}
        <div className="flex w-full items-center">
          <div className="flex-1 text-xl text-zinc-600 dark:text-zinc-100">
            devicename
          </div>
          <a href="/explore">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="h-6 w-6 text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 hover:dark:text-zinc-100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </a>
        </div>
        <div className="relative flex-1 overflow-y-auto">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            <AccordionItem value="item-1" className="sticky top-0 z-10">
              <AccordionTrigger className="font-bold">Image</AccordionTrigger>
              <AccordionContent>
                <div className="flex w-full items-center justify-center p-4">
                  <img
                    className="rounded-lg"
                    alt=""
                    src={"/sensebox_outdoor.jpg"}
                  ></img>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-bold">
                Description
              </AccordionTrigger>
              <AccordionContent>
                quis lectus nulla at volutpat diam ut venenatis tellus in metus
                vulputate eu scelerisque felis imperdiet proin fermentum leo vel
                orci porta non pulvinar neque laoreet suspendisse interdum
                consectetur libero
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-bold">Sensors</AccordionTrigger>
              <AccordionContent>
                <Form
                  method="get"
                  onChange={(e) => {
                    submit(e.currentTarget);
                  }}
                  className={
                    navigation.state === "loading" ? "pointer-events-none" : ""
                  }
                >
                  <div>
                    <ul className="dark:divide-white/10 z-0 flex-1 divide-y divide-gray-200 overflow-y-auto">
                      {data.device.sensors.map((sensor: Sensor) => {
                        // dont really know why this is necessary - some kind of TypeScript/i18n bug?
                        const lastMeasurement =
                          sensor.lastMeasurement as Prisma.JsonObject;
                        const value = lastMeasurement.value as string;
                        return (
                          <li key={sensor.id}>
                            <div className="group relative flex items-center px-2 py-3">
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
                                  className="dark:group-hover:bg-zinc-700/[.30] absolute inset-0 group-hover:bg-zinc-300 group-hover:opacity-30"
                                  aria-hidden="true"
                                ></div>
                                <div className="relative flex min-w-0 flex-1 items-center gap-4">
                                  <svg
                                    viewBox="0 0 512 512"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                    className="inline-block h-8 w-8 flex-shrink-0"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M256 512C397.385 512 512 397.385 512 256C512 114.615 397.385 0 256 0C114.615 0 0 114.615 0 256C0 397.385 114.615 512 256 512ZM324.59 323.365C362.471 285.526 362.471 224.176 324.59 186.337C286.709 148.497 225.291 148.497 187.41 186.337C149.529 224.176 149.529 285.526 187.41 323.365C194.83 330.777 194.83 342.793 187.41 350.205C179.99 357.616 167.96 357.616 160.541 350.205C107.82 297.542 107.82 212.159 160.541 159.497C213.261 106.834 298.739 106.834 351.459 159.497C404.18 212.159 404.18 297.542 351.459 350.205C344.04 357.616 332.01 357.616 324.59 350.205C317.17 342.793 317.17 330.777 324.59 323.365ZM256.005 259.894C266.498 259.894 275.004 267.975 275.004 277.943V349.951C275.004 359.919 266.498 368 256.005 368C245.511 368 237.005 359.919 237.005 349.951V277.943C237.005 267.975 245.511 259.894 256.005 259.894ZM256.005 204.693C266.498 204.693 275.004 213.19 275.004 223.672V223.932C275.004 234.414 266.498 242.911 256.005 242.911C245.511 242.911 237.005 234.414 237.005 223.932V223.672C237.005 213.19 245.511 204.693 256.005 204.693Z"
                                      fill="#27EE76"
                                    ></path>
                                  </svg>
                                  <div className={"truncate"}>
                                    <p
                                      className={
                                        "truncate text-sm font-medium leading-5 dark:text-zinc-100" +
                                        (sensorIds.includes(sensor.id)
                                          ? " text-green-100"
                                          : "text-gray-900")
                                      }
                                    >
                                      {sensor.title}
                                    </p>
                                    <p className="truncate text-xs text-gray-600 dark:text-zinc-300">
                                      {value + sensor.unit}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      {sensorIds.length > 0 ? <Graph /> : null}
    </>
  );
}
