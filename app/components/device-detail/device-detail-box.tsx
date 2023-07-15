// import { useState } from "react";
import {
  Form,
  useLoaderData,
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
import type { loader } from "~/routes/explore/$deviceId";
import { ChevronUp, Minus, Thermometer, X } from "lucide-react";
import { useRef, useState } from "react";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";

export interface LastMeasurementProps {
  createdAt: Date;
  value: string;
}

export interface DeviceAndSelectedSensors {
  device: DeviceWithSensors;
  selectedSensors: Sensor[];
}

export default function DeviceDetailBox() {
  const navigation = useNavigation();
  const data = useLoaderData<typeof loader>();
  const nodeRef = useRef(null);
  const [open, setOpen] = useState(true);
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);
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

  function handleDrag(e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  return (
    <>
      {open && (
        <Draggable
          nodeRef={nodeRef}
          defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
          onDrag={handleDrag}
          bounds="#osem"
          handle="#deviceDetailBox"
        >
          <div
            id="deviceDetailBox"
            ref={nodeRef}
            className="shadow-zinc-800/5 ring-zinc-900/5 absolute bottom-28 left-4 right-4 top-6 z-40 flex w-auto cursor-move flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 sm:bottom-[30px] sm:left-[10px] sm:right-auto sm:top-auto sm:max-h-[calc(100vh-8rem)] sm:w-1/4"
          >
            {navigation.state === "loading" && (
              <div className="bg-gray-100/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <Spinner />
              </div>
            )}
            <div className="flex w-full items-center gap-3 py-2">
              <div
                className={
                  data.device.status === "ACTIVE"
                    ? "h-4 w-4 rounded-full bg-green-100"
                    : "h-4 w-4 rounded-full bg-red-500"
                }
              ></div>
              <div className="flex flex-1 text-center text-xl text-zinc-600">
                {data.device.name}
              </div>
              <div className="flex items-center gap-2">
                <Minus
                  className="cursor-pointer"
                  onClick={() => setOpen(false)}
                />
                <X className="cursor-pointer" />
              </div>
            </div>
            <div className="relative flex-1 overflow-y-auto">
              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="item-1"
              >
                <AccordionItem value="item-1" className="sticky top-0 z-10">
                  <AccordionTrigger className="font-bold">
                    Image
                  </AccordionTrigger>
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
                    quis lectus nulla at volutpat diam ut venenatis tellus in
                    metus vulputate eu scelerisque felis imperdiet proin
                    fermentum leo vel orci porta non pulvinar neque laoreet
                    suspendisse interdum consectetur libero
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
                    Sensors
                  </AccordionTrigger>
                  <AccordionContent>
                    <Form
                      method="get"
                      onChange={(e) => {
                        submit(e.currentTarget);
                      }}
                      className={
                        navigation.state === "loading"
                          ? "pointer-events-none"
                          : ""
                      }
                    >
                      <div>
                        <ul className="z-0 flex-1 divide-y divide-gray-200 overflow-y-auto">
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
                                        searchParams.getAll("sensor").length >=
                                          2
                                          ? true
                                          : false
                                      } // check if there are already two selected and this one is not one of them
                                      type="checkbox"
                                      name="sensor"
                                      id={sensor.id}
                                      value={sensor.id}
                                      defaultChecked={sensorIds.includes(
                                        sensor.id
                                      )}
                                    />
                                    <div
                                      className="absolute inset-0 group-hover:bg-zinc-300 group-hover:opacity-30"
                                      aria-hidden="true"
                                    ></div>
                                    <div className="relative flex min-w-0 flex-1 items-center gap-4">
                                      {/* add dynamic icons here */}
                                      <Thermometer />
                                      <div className={"truncate"}>
                                        <p
                                          className={
                                            "truncate text-sm font-medium leading-5" +
                                            (sensorIds.includes(sensor.id)
                                              ? " text-green-100"
                                              : "text-gray-900")
                                          }
                                        >
                                          {sensor.title}
                                        </p>
                                        <p className="truncate text-xs text-gray-600">
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
        </Draggable>
      )}
      {!open && (
        <div
          onClick={() => {
            setOpen(true);
          }}
          className="absolute bottom-28 left-4 right-4 top-6 z-40 flex cursor-pointer rounded-xl bg-white px-4 py-2 shadow-lg ring-1 sm:bottom-[30px] sm:left-[10px] sm:right-auto sm:top-auto"
        >
          <ChevronUp />
        </div>
      )}
      {sensorIds.length > 0 ? Graph(open) : null}
    </>
  );
}
