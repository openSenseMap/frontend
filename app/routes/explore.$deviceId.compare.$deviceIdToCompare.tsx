import type { Sensor, SensorWithMeasurement } from "~/schema";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { ChevronUp, Minus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";
import Spinner from "~/components/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getDevice } from "~/models/device.server";
import { getSensorsWithLastMeasurement } from "~/models/sensor.server";
import { getMeasurement } from "~/models/measurement.server";
import { adjustBrightness, getGraphColor } from "~/lib/utils";
import Graph from "~/components/device-detail/graph";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Separator } from "~/components/ui/separator";
import { useSharedCompareMode } from "~/components/device-detail/device-detail-box";
import addDays from "date-fns/addDays";

interface ExtendedSensor extends Sensor {
  device_name: string;
}

function mergeSensors(sensorsFromDevice1: any, sensorsFromDevice2: any) {
  // Combine both arrays
  const mergedArray = [...sensorsFromDevice1, ...sensorsFromDevice2];

  // Create an array to hold sensor groups
  const sensorGroups: any[][] = [];

  // Loop through the merged array and group sensors by title
  mergedArray.forEach((sensor) => {
    // Check if there's an existing group for the title
    const groupIndex = sensorGroups.findIndex(
      (group) => group[0].title === sensor.title,
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

export async function loader({ params, request }: LoaderFunctionArgs) {
  // Extracting the selected sensors from the URL query parameters using the stringToArray function
  const url = new URL(request.url);

  if (!params.deviceId || !params.deviceIdToCompare) {
    return redirect("/explore");
  }

  const device1 = await getDevice({ id: params.deviceId });
  const sensorsFromDevice1 = await getSensorsWithLastMeasurement(
    params.deviceId,
  );
  const device2 = await getDevice({ id: params.deviceIdToCompare });
  const sensorsFromDevice2 = await getSensorsWithLastMeasurement(
    params.deviceIdToCompare,
  );

  if (!device1 || !device2) {
    throw new Response("Device not found", { status: 502 });
  }

  const sensorGroups = mergeSensors(sensorsFromDevice1, sensorsFromDevice2);

  // Find all sensors from the device response that have the same id as one of the sensor array value
  const sensorIds = url.searchParams.getAll("sensor");
  const aggregation = url.searchParams.get("aggregation") || "raw";
  const startDate = url.searchParams.get("date_from") || undefined;
  const endDate = url.searchParams.get("date_to") || undefined;
  var sensorsToQuery = [...sensorsFromDevice1, ...sensorsFromDevice2].filter(
    (sensor: any) => sensorIds.includes(sensor.id),
  );

  if (!sensorsToQuery) {
    return json({
      device1,
      device2,
      sensorGroups,
      aggregation,
      selectedSensors: [],
    });
  }

  const selectedSensors: ExtendedSensor[] = await Promise.all(
    sensorsToQuery.map(async (sensor: any) => {
      if (startDate && endDate) {
        const sensorData = await getMeasurement(
          sensor.id,
          aggregation,
          new Date(startDate),
          addDays(new Date(endDate), 1),
        );
        return {
          ...sensor,
          data: sensorData as any,
        };
      } else {
        const sensorData = await getMeasurement(sensor.id, aggregation);
        return {
          ...sensor,
          data: sensorData as any,
        };
      }
    }),
  );
  selectedSensors.map((sensor: any) => {
    let color = getGraphColor(sensor.title);

    // Check if there is another sensor with the same title but from a different device
    const matchingSensors = selectedSensors.filter(
      (s) => s.title === sensor.title && s.device_name !== sensor.device_name,
    );

    if (matchingSensors.length > 0) {
      // Determine if this sensor should be darker or brighter
      const isPrimarySensor =
        sensor.device_name < matchingSensors[0].device_name;

      // Adjust brightness: one darker, the other brighter
      color = adjustBrightness(color, isPrimarySensor ? -100 : 100);
    }

    sensor.color = color;
    return color;
  });

  return json({
    device1,
    device2,
    sensorGroups,
    selectedSensors,
    aggregation: aggregation,
    fromDate: startDate,
    toDate: endDate,
  });
}

export default function CompareDevices() {
  const data = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const nodeRef = useRef(null);
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);
  const [open, setOpen] = useState(true);
  const [, setOpenGraph] = useState(
    Boolean(data.selectedSensors.length > 0 ? true : false),
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

  const getDeviceImage = (imageUri: string | null) =>
    imageUri !== null
      ? `https://opensensemap.org/userimages/${imageUri}`
      : "https://images.placeholders.dev/?width=400&height=350&text=No%20image&bgColor=%234fae48&textColor=%23727373";

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
                className="shadow-zinc-800/5 ring-zinc-900/5 relative float-left flex w-auto flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-sm sm:max-h-[calc(100vh-8rem)]"
              >
                {navigation.state === "loading" && (
                  <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                    <Spinner />
                  </div>
                )}

                <div
                  id="deviceDetailBoxTop"
                  className="flex cursor-move w-full items-center pt-4 text-xl"
                >
                  <div className="relative w-full flex flex-col">
                    {/* Buttons Container */}
                    <div className="absolute top-0 right-0 flex items-center gap-2 pr-2">
                      <Minus
                        className="cursor-pointer"
                        onClick={() => setOpen(false)}
                      />
                      <X
                        className="cursor-pointer"
                        onClick={() => {
                          if (searchParams.has("sensor")) {
                            searchParams.delete("sensor");
                          }
                          navigate({
                            pathname: "/explore",
                            search: searchParams.toString(),
                          });
                        }}
                      />
                    </div>

                    {/* Names Container */}
                    <div className="flex w-full justify-center mt-8">
                      <p className="flex w-1/2 items-center justify-center text-center">
                        {data.device1.name}
                      </p>
                      <p className="flex w-1/2 items-center justify-center text-center">
                        {data.device2.name}
                      </p>
                    </div>
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
                      <AccordionTrigger className="justify-start gap-2 font-bold">
                        Image
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex">
                          <div className="flex w-full items-center justify-center p-4">
                            <img
                              className="rounded-lg"
                              alt=""
                              src={getDeviceImage(data.device1.image)}
                            ></img>
                          </div>
                          <div className="flex w-full items-center justify-center p-4">
                            <img
                              className="rounded-lg"
                              alt=""
                              src={getDeviceImage(data.device2.image)}
                            ></img>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  {(data.device1.description || data.device2.description) && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="justify-start gap-2 font-bold">
                          Description
                        </AccordionTrigger>
                        <AccordionContent>
                          {/* Display single row table with both descriptions next to each other */}
                          <div className="flex w-full items-center justify-center">
                            <p className="p-4">
                              {data.device1.description || <Minus />}
                            </p>
                            <Separator orientation="vertical" />
                            <p className="p-4">
                              {data.device2.description || <Minus />}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
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
                            // handle sensor selection and keep time/aggregation params if at least one sensor is selected
                            const formData = new FormData(e.currentTarget);
                            if (formData.getAll("sensor").length > 0) {
                              searchParams.delete("sensor");
                              searchParams.forEach((value, key) => {
                                formData.append(key, value);
                              });
                            }
                            submit(formData);
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
                                  (
                                    sensorGroup: SensorWithMeasurement[],
                                    index,
                                  ) => {
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
                                                    sensorGroup[0].id,
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
                                                  sensorGroup[0].id,
                                                )}
                                              />
                                              <p
                                                className={
                                                  "cursor-pointer truncate text-sm font-medium leading-5" +
                                                  (sensorIds.includes(
                                                    sensorGroup[0].id,
                                                  )
                                                    ? " text-light-green"
                                                    : "text-gray-900")
                                                }
                                              >
                                                {sensorGroup[0].value +
                                                  " " +
                                                  sensorGroup[0].unit}
                                              </p>
                                            </label>
                                          ) : (
                                            <Minus />
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {sensorGroup[1] ? (
                                            <label htmlFor={sensorGroup[1].id}>
                                              <input
                                                className="peer hidden"
                                                disabled={
                                                  !sensorIds.includes(
                                                    sensorGroup[1].id,
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
                                                  sensorGroup[1].id,
                                                )}
                                              />
                                              <p
                                                className={
                                                  "cursor-pointer truncate text-sm font-medium leading-5" +
                                                  (sensorIds.includes(
                                                    sensorGroup[1].id,
                                                  )
                                                    ? " text-light-green"
                                                    : "text-gray-900")
                                                }
                                              >
                                                {sensorGroup[1].value +
                                                  " " +
                                                  sensorGroup[1].unit}
                                              </p>
                                            </label>
                                          ) : (
                                            <Minus />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  },
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
            </div>
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
        <Graph sensors={data.selectedSensors} aggregation={data.aggregation} />
      ) : null}
    </>
  );
}
