import type { Prisma, Sensor } from "@prisma/client";
import { json, redirect, type LoaderArgs } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { ChevronUp, LineChart, Minus, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";
import ShareLink from "~/components/device-detail/share-link";
import Spinner from "~/components/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getDevice } from "~/models/device.server";
import { getSensors } from "~/models/sensor.server";
import { getMeasurement } from "~/models/measurement.server";
import { getGraphColor } from "~/lib/utils";
import Graph from "~/components/device-detail/graph";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Separator } from "~/components/ui/separator";
import { useSharedCompareMode } from "~/components/device-detail/device-detail-box";

function mergeSensors(
  sensorsFromDevice1: Sensor[],
  sensorsFromDevice2: Sensor[]
) {
  // Combine both arrays
  const mergedArray = [...sensorsFromDevice1, ...sensorsFromDevice2];

  // Create an array to hold sensor groups
  const sensorGroups: any[][] = [];

  // Loop through the merged array and group sensors by title
  mergedArray.forEach((sensor) => {
    // Check if there's an existing group for the title
    const groupIndex = sensorGroups.findIndex(
      (group) => group[0].title === sensor.title
    );

    if (groupIndex !== -1) {
      // If a group already exists for the title, add the sensor to the group
      sensorGroups[groupIndex].push(sensor);
    } else {
      // If no group exists, create a new group with the sensor and add it to the sensorGroups array
      sensorGroups.push([sensor]);
    }
  });

  sensorGroups.map((sensorGroup) => {
    if (sensorGroup.length === 1) {
      if (sensorGroup[0].deviceId === sensorsFromDevice1[0].deviceId) {
        // append empty array to end of the array
        sensorGroup.push(null);
      } else {
        // insert to first position
        sensorGroup.unshift(null);
      }
    }
    return sensorGroup;
  });

  return sensorGroups;
}

export async function loader({ params, request }: LoaderArgs) {
  // Extracting the selected sensors from the URL query parameters using the stringToArray function
  const url = new URL(request.url);

  if (!params.deviceId || !params.deviceIdToCompare) {
    return redirect("/explore");
  }

  const device1 = await getDevice({ id: params.deviceId });
  const sensorsFromDevice1 = await getSensors(params.deviceId);
  const device2 = await getDevice({ id: params.deviceIdToCompare });
  const sensorsFromDevice2 = await getSensors(params.deviceIdToCompare);

  if (!device1 || !device2) {
    throw new Response("Device not found", { status: 502 });
  }

  const sensorGroups = mergeSensors(sensorsFromDevice1, sensorsFromDevice2);

  // Find all sensors from the device response that have the same id as one of the sensor array value
  const sensorIds = url.searchParams.getAll("sensor");
  const aggregation = url.searchParams.get("aggregation") || "raw";
  var sensorsToQuery = [...sensorsFromDevice1, ...sensorsFromDevice2].filter(
    (sensor: Sensor) => sensorIds.includes(sensor.id)
  );

  if (!sensorsToQuery) {
    return json({
      device1,
      device2,
      sensorGroups,
      selectedSensors: [],
    });
  }

  const selectedSensors: Sensor[] = await Promise.all(
    sensorsToQuery.map(async (sensor: Sensor) => {
      const sensorData = await getMeasurement(sensor.id, aggregation);
      return {
        ...sensor,
        data: sensorData as any,
      };
    })
  );
  selectedSensors.map((sensor: any) => {
    const color = getGraphColor(sensor.title);
    sensor.color = color;
    return color;
  });

  return json({
    device1,
    device2,
    sensorGroups,
    selectedSensors,
    aggregation: aggregation,
  });
}

export default function CompareDevices() {
  const data = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const nodeRef = useRef(null);
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);
  const [open, setOpen] = useState(true);
  const [openGraph, setOpenGraph] = useState(
    Boolean(data.selectedSensors.length > 0 ? true : false)
  );
  const { setCompareMode } = useSharedCompareMode();
  setCompareMode(false);

  // form submission handler
  const submit = useSubmit();

  useEffect(() => {
    setOpenGraph(Boolean(data.selectedSensors.length));
  }, [data.selectedSensors]);

  const [searchParams] = useSearchParams();
  // get list of selected sensor ids from URL search params
  const sensorIds = searchParams.getAll("sensor");

  function handleDrag(_e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  let navigate = useNavigate();
  const routeChange = (newPath: string) => {
    let path = newPath;
    navigate(path);
  };

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
                  className="flex w-full cursor-move items-center px-4 pt-4 text-xl"
                >
                  <p className="flex w-1/2 items-center justify-center text-center">
                    {data.device1.name}
                  </p>
                  <p className="flex w-1/2 items-center justify-center text-center">
                    {data.device2.name}
                  </p>
                </div>
                <div className="relative flex-1 overflow-y-auto">
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue="item-1"
                  >
                    <AccordionItem value="item-1" className="sticky top-0 z-10">
                      <AccordionTrigger className="justify-start gap-2 font-bold">
                        Image
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex">
                          <div className="flex w-full items-center justify-center p-4">
                            <img
                              className="rounded-lg"
                              alt=""
                              src={"/sensebox_outdoor.jpg"}
                            ></img>
                          </div>
                          <div className="flex w-full items-center justify-center p-4">
                            <img
                              className="rounded-lg"
                              alt=""
                              src={"/sensebox_outdoor.jpg"}
                            ></img>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    // defaultValue="item-1"
                  >
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="justify-start gap-2 font-bold">
                        Description
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* display single row table with both descriptions next to each other */}
                        <div className="flex w-full items-center justify-center">
                          <p className="p-4">
                            {data.device1.description ||
                              "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam"}
                          </p>
                          <Separator orientation="vertical" />
                          <p className="p-4">
                            {data.device2.description ||
                              "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam"}
                          </p>
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
                      <AccordionTrigger className="justify-start gap-2 font-bold">
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
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Phenomenon</TableHead>
                                  <TableHead>{data.device1.name}</TableHead>
                                  <TableHead>{data.device2.name}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.sensorGroups.map(
                                  (sensorGroup: Sensor[], index) => {
                                    // dont really know why this is necessary - some kind of TypeScript/i18n bug?
                                    const lastMeasurement0 = sensorGroup[0]
                                      ?.lastMeasurement as Prisma.JsonObject;
                                    const value0 =
                                      lastMeasurement0?.value as string;
                                    const lastMeasurement1 = sensorGroup[1]
                                      ?.lastMeasurement as Prisma.JsonObject;
                                    const value1 =
                                      lastMeasurement1?.value as string;

                                    return (
                                      <TableRow key={index}>
                                        <TableCell className="font-medium">
                                          {sensorGroup[0]?.title ||
                                            sensorGroup[1]?.title}
                                        </TableCell>
                                        <TableCell>
                                          {sensorGroup[0] ? (
                                            <label htmlFor={sensorGroup[0].id}>
                                              <input
                                                className="peer hidden"
                                                disabled={
                                                  !sensorIds.includes(
                                                    sensorGroup[0].id
                                                  ) &&
                                                  searchParams.getAll("sensor")
                                                    .length >= 2
                                                    ? true
                                                    : false
                                                } // check if there are already two selected and this one is not one of them
                                                type="checkbox"
                                                name="sensor"
                                                id={sensorGroup[0].id}
                                                value={sensorGroup[0].id}
                                                defaultChecked={sensorIds.includes(
                                                  sensorGroup[0].id
                                                )}
                                              />
                                              <p
                                                className={
                                                  "cursor-pointer truncate text-sm font-medium leading-5" +
                                                  (sensorIds.includes(
                                                    sensorGroup[0].id
                                                  )
                                                    ? " text-green-100"
                                                    : "text-gray-900")
                                                }
                                              >
                                                {sensorGroup[0]
                                                  ? value0 +
                                                    " " +
                                                    sensorGroup[0]?.unit
                                                  : "---"}
                                              </p>
                                            </label>
                                          ) : null}
                                        </TableCell>
                                        <TableCell>
                                          {sensorGroup[1] ? (
                                            <label htmlFor={sensorGroup[1].id}>
                                              <input
                                                className="peer hidden"
                                                disabled={
                                                  !sensorIds.includes(
                                                    sensorGroup[1].id
                                                  ) &&
                                                  searchParams.getAll("sensor")
                                                    .length >= 2
                                                    ? true
                                                    : false
                                                } // check if there are already two selected and this one is not one of them
                                                type="checkbox"
                                                name="sensor"
                                                id={sensorGroup[1].id}
                                                value={sensorGroup[1].id}
                                                defaultChecked={sensorIds.includes(
                                                  sensorGroup[1].id
                                                )}
                                              />
                                              <p
                                                className={
                                                  "cursor-pointer truncate text-sm font-medium leading-5" +
                                                  (sensorIds.includes(
                                                    sensorGroup[1].id
                                                  )
                                                    ? " text-green-100"
                                                    : "text-gray-900")
                                                }
                                              >
                                                {sensorGroup[1]
                                                  ? value1 +
                                                    " " +
                                                    sensorGroup[1]?.unit
                                                  : "---"}
                                              </p>
                                            </label>
                                          ) : null}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                )}
                              </TableBody>
                            </Table>
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
