// import { useState } from "react";
import {
  Form,
  useLoaderData,
  useNavigate,
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
import {
  Archive,
  ChevronUp,
  LineChart,
  Minus,
  Share2,
  Thermometer,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import ShareLink from "./share-link";
import { getArchiveLink } from "~/utils/device";

export interface LastMeasurementProps {
  time: Date;
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
  // state variables
  const [open, setOpen] = useState(true);
  const [openGraph, setOpenGraph] = useState(
    Boolean(data.selectedSensors.length > 0 ? true : false)
  );
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);

  useEffect(() => {
    setOpenGraph(Boolean(data.selectedSensors.length));
  }, [data.selectedSensors]);

  const [searchParams] = useSearchParams();

  let navigate = useNavigate();
  const routeChange = (newPath: string) => {
    let path = newPath;
    navigate(path);
  };

  // form submission handler
  const submit = useSubmit();

  // get list of selected sensor ids from URL search params
  const sensorIds = searchParams.getAll("sensor");

  function handleDrag(_e: any, data: DraggableData) {
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
          handle="#deviceDetailBoxTop"
        >
          <div
            ref={nodeRef}
            className="absolute bottom-[10px] left-4 z-40 sm:bottom-[30px] sm:left-[10px] sm:max-h-[calc(100vh-8rem)] sm:w-1/3"
          >
            <div className="flex flex-row">
              <div
                id="deviceDetailBox"
                className="shadow-zinc-800/5 ring-zinc-900/5 relative float-left flex w-auto flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 sm:max-h-[calc(100vh-8rem)]"
              >
                {navigation.state === "loading" && (
                  <div className="bg-gray-100/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                    <Spinner />
                  </div>
                )}
                <div
                  id="deviceDetailBoxTop"
                  className="flex w-full cursor-move items-center gap-3 py-2"
                >
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
                        {/* use device description */}
                        {data.device.description}
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
                              {data.sensors.map((sensor: Sensor) => {
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
                                            searchParams.getAll("sensor")
                                              .length >= 2
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
              <div className="mx-1">
                <div className="flex flex-col items-center gap-2">
                  <div
                    onClick={() => routeChange("/explore")}
                    className="shadow-zinc-800/5 ring-zinc-900/5 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 hover:brightness-90"
                  >
                    <X />
                  </div>
                  <div
                    onClick={() => setOpen(false)}
                    className="shadow-zinc-800/5 ring-zinc-900/5 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 hover:brightness-90"
                  >
                    <Minus />
                  </div>
                  <div className="shadow-zinc-800/5 ring-zinc-900/5 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 hover:brightness-90">
                    <a
                      href={getArchiveLink(data.device)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open archive"
                    >
                      <Archive />
                    </a>
                  </div>
                  {sensorIds.length > 0 && !openGraph ? (
                    <div
                      onClick={() => setOpenGraph(true)}
                      className="shadow-zinc-800/5 ring-zinc-900/5 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 hover:brightness-90"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <LineChart />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open line chart</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : null}
                  <div className="shadow-zinc-800/5 ring-zinc-900/5 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 hover:brightness-90">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Share2 className="cursor-pointer" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Share this link</AlertDialogTitle>
                          <ShareLink />
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Close</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Draggable>
      )}
      {!open && (
        <div
          onClick={() => {
            setOpen(true);
          }}
          className="absolute bottom-[10px] left-4 flex cursor-pointer rounded-xl bg-white shadow-lg ring-1 transition-colors duration-300 ease-in-out hover:brightness-90 sm:bottom-[30px] sm:left-[10px]"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-4 py-2 ">
                  <ChevronUp />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open device details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      {sensorIds.length > 0 ? (
        <Graph setOpenGraph={setOpenGraph} openGraph={openGraph} />
      ) : null}
    </>
  );
}
