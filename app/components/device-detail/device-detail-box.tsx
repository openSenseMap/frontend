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
import Spinner from "../spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import type { loader } from "~/routes/explore.$deviceId._index";
import {
  Archive,
  ChevronUp,
  Scale,
  LineChart,
  Minus,
  Share2,
  X,
  XSquare,
  RefreshCcw,
  RefreshCwOff,
  LineChartIcon,
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
import { useBetween } from "use-between";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { isMobile, isTablet, isBrowser } from "react-device-detect";
import { Label } from "../ui/label";
import type { Device, Sensor, SensorWithMeasurement } from "~/schema";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import SensorIcon from "../sensor-icon";
import { Toggle } from "../ui/toggle";
import { Separator } from "../ui/separator";

export interface LastMeasurementProps {
  time: Date;
  value: string;
}

export interface DeviceAndSelectedSensors {
  device: Device;
  selectedSensors: Sensor[];
}

const useCompareMode = () => {
  const [compareMode, setCompareMode] = useState(false);
  return { compareMode, setCompareMode };
};

export const useSharedCompareMode = () => useBetween(useCompareMode);

export default function DeviceDetailBox() {
  const navigation = useNavigation();
  const data = useLoaderData<typeof loader>();
  const nodeRef = useRef(null);
  // state variables
  const [open, setOpen] = useState(true);
  const [openGraph, setOpenGraph] = useState(
    Boolean(data.selectedSensors.length > 0 ? true : false),
  );
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);
  const { compareMode, setCompareMode } = useSharedCompareMode();
  const [refreshOn, SetRefreshOn] = useState(false);
  const [refreshSecond, setRefreshSecond] = useState(59);
  useEffect(() => {
    setOpenGraph(Boolean(data.selectedSensors.length));
  }, [data.selectedSensors]);

  const [sensors, setSensors] = useState<SensorWithMeasurement[]>();
  useEffect(() => {
    setSensors(data.sensors);
  }, [data.sensors]);

  const [searchParams] = useSearchParams();

  let navigate = useNavigate();
  const routeChange = (newPath: string) => {
    // keep all params except sensor and date params
    searchParams.delete("sensor");
    searchParams.delete("date_from");
    searchParams.delete("date_to");
    searchParams.delete("aggregation");
    navigate({ pathname: newPath, search: searchParams.toString() });
  };

  // form submission handler
  const submit = useSubmit();

  // get list of selected sensor ids from URL search params
  const sensorIds = searchParams.getAll("sensor");

  function handleDrag(_e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  function handleCompareClick() {
    setCompareMode(!compareMode);
    setOpenGraph(false);
    setOpen(false);
  }

  useEffect(() => {
    let interval: any = null;
    if (refreshOn) {
      if (refreshSecond == 0) {
        setRefreshSecond(59);
      }
      interval = setInterval(() => {
        setRefreshSecond((refreshSecond) => refreshSecond - 1);
      }, 1000);
    } else if (!refreshOn) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [refreshOn, refreshSecond]);

  return (
    <>
      {compareMode && (
        <Alert className="absolute bottom-4 left-1/2 right-1/2 w-1/4 -translate-x-1/2 -translate-y-1/2 transform animate-pulse dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
          <XSquare
            className="h-4 w-4 cursor-pointer"
            onClick={() => {
              setCompareMode(!compareMode);
              setOpen(true);
            }}
          />
          <AlertTitle>Compare devices</AlertTitle>
          <AlertDescription className="inline">
            Choose a device from the map to compare with.
          </AlertDescription>
        </Alert>
      )}
      {open && (
        <Draggable
          nodeRef={nodeRef}
          defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
          onDrag={handleDrag}
          bounds="#osem"
          handle="#deviceDetailBoxTop"
          disabled={!isBrowser && !isTablet}
        >
          <div
            ref={nodeRef}
            className="absolute bottom-6 left-4 right-4 top-14 z-40 flex flex-row px-4 py-2 md:bottom-[30px] md:left-[10px] md:top-auto md:max-h-[calc(100vh-8rem)] md:w-1/3 md:p-0"
          >
            <div
              id="deviceDetailBox"
              className={
                "shadow-zinc-800/5 ring-zinc-900/5 relative float-left flex h-full max-h-[calc(100vh-4rem)] w-auto flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-sm md:max-h-[calc(100vh-8rem)]"
              }
            >
              {navigation.state === "loading" && (
                <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
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
                <div className="flex flex-1 text-center text-xl text-zinc-600 dark:dark:text-zinc-100">
                  {data.device.name}
                </div>
              </div>
              <div className="no-scrollbar relative flex-1 overflow-y-scroll">
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  defaultValue="item-1"
                >
                  <AccordionItem value="item-1" className="sticky top-0 z-10">
                    <AccordionTrigger className="font-bold dark:dark:text-zinc-100">
                      Image
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex w-full items-center justify-center p-4 opacity-100">
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
                  defaultValue={data.device.description ? "item-1" : ""}
                >
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="font-bold dark:dark:text-zinc-100">
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
                  defaultValue={"item-1"}
                >
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="font-bold dark:dark:text-zinc-100">
                      Sensors
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {sensors
                          ? sensors.map((sensor: SensorWithMeasurement) => {
                              return (
                                <Card key={sensor.id}>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                      {sensor.title}
                                    </CardTitle>
                                    <SensorIcon
                                      title={sensor.title || ""}
                                      className="h-4 w-4 text-muted-foreground"
                                    />
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-row items-center space-x-2">
                                      <div className="text-2xl font-bold">
                                        {sensor.value}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {sensor.unit}
                                      </p>
                                    </div>
                                  </CardContent>
                                  <Separator />
                                  <CardFooter className="justify-between px-6 py-3">
                                    <div className="flex items-center gap-1">
                                      <div
                                        className={
                                          sensor.status === "active"
                                            ? "h-2 w-2 rounded-full bg-green-100"
                                            : "h-2 w-2 rounded-full bg-red-500"
                                        }
                                      ></div>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(
                                          new Date(sensor.time),
                                        )}{" "}
                                        ago
                                      </p>
                                    </div>
                                    <Toggle
                                      variant="outline"
                                      size="sm"
                                      aria-label="Toggle italic"
                                    >
                                      <LineChartIcon className="h-3 w-3" />
                                    </Toggle>
                                  </CardFooter>
                                </Card>
                              );
                            })
                          : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
            {!isMobile && (
              <div className="mx-1">
                <div className="flex flex-col items-center gap-2">
                  <div
                    onClick={() => routeChange("/explore")}
                    className="shadow-zinc-800/5 cursor-pointer rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90"
                  >
                    <X />
                  </div>
                  <div
                    onClick={() => setOpen(false)}
                    className="shadow-zinc-800/5 cursor-pointer rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90"
                  >
                    <Minus />
                  </div>
                  <div
                    onClick={() => handleCompareClick()}
                    className="shadow-zinc-800/5 cursor-pointer rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90"
                  >
                    <Scale />
                  </div>
                  <div className="shadow-zinc-800/5 cursor-pointer rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90">
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
                      className="shadow-zinc-800/5 cursor-pointer rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90"
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
                  <div className="shadow-zinc-800/5 cursor-pointer rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90">
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

                  <div
                    onClick={() => {
                      SetRefreshOn(!refreshOn);
                      setRefreshSecond(59);
                    }}
                    className="shadow-zinc-800/5 cursor-pointer rounded-xl border border-gray-100 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800 shadow-lg hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90 flex items-center justify-center"
                  >
                    {refreshOn ? (
                      <>
                        <Label className=" absolute text-xs m-0 p-0 cursor-pointer ">
                          {refreshSecond}
                        </Label>
                        <RefreshCcw className="m-0 p-0 inline h-9  w-9"></RefreshCcw>
                      </>
                    ) : (
                      <RefreshCwOff className="m-0 p-0 inline h-9  w-9" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Draggable>
      )}
      {!open && (
        <div
          onClick={() => {
            setOpen(true);
          }}
          className="absolute bottom-[10px] left-4 flex cursor-pointer rounded-xl border border-gray-100 bg-white shadow-lg transition-colors duration-300 ease-in-out hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90 sm:bottom-[30px] sm:left-[10px]"
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
