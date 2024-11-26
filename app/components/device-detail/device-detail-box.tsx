import {
  useLoaderData,
  useMatches,
  useNavigate,
  useNavigation,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import Spinner from "../spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import type { loader } from "~/routes/explore+/$deviceId+/_$deviceId";
import {
  ChevronUp,
  Minus,
  Share2,
  XSquare,
  EllipsisVertical,
  X,
  ExternalLink,
  Scale,
  Archive,
  Cpu,
  Rss,
  CalendarPlus,
  Hash,
  LandPlot,
  Image as ImageIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
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
import { isTablet, isBrowser } from "react-device-detect";
import type { SensorWithMeasurement } from "~/schema";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import SensorIcon from "../sensor-icon";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import EntryLogs from "./entry-logs";
import { useToast } from "../ui/use-toast";

export interface MeasurementProps {
  sensorId: string;
  time: Date;
  value: string;
  min_value: string;
  max_value: string;
}

const useCompareMode = () => {
  const [compareMode, setCompareMode] = useState(false);
  return { compareMode, setCompareMode };
};

export const useSharedCompareMode = () => useBetween(useCompareMode);

export default function DeviceDetailBox() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const matches = useMatches();
  const { toast } = useToast();

  const sensorIds = new Set();
  // Check the last two segments of the URL
  const lastSegment = matches[matches.length - 1]?.params?.sensorId2;
  if (lastSegment) {
    const secondLastSegment = matches[matches.length - 2]?.params?.sensorId;
    sensorIds.add(secondLastSegment);
    sensorIds.add(lastSegment);
  } else {
    const lastSegment = matches[matches.length - 1]?.params?.sensorId;
    sensorIds.add(lastSegment);
  }

  const data = useLoaderData<typeof loader>();
  const nodeRef = useRef(null);
  // state variables
  const [open, setOpen] = useState(true);
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);
  const { compareMode, setCompareMode } = useSharedCompareMode();
  const [refreshOn] = useState(false);
  const [refreshSecond, setRefreshSecond] = useState(59);

  const [sensors, setSensors] = useState<SensorWithMeasurement[]>();
  useEffect(() => {
    setSensors(data.sensors);
  }, [data.sensors]);

  const [searchParams] = useSearchParams();

  const { deviceId } = useParams(); // Get the deviceId from the URL params

  // Function to handle sensor click
  const handleSensorClick = (sensorId: string) => {
    // check if that last entry is the same as the current sensorId
    if (sensorIds.has(sensorId)) {
      const sensorIdArray = Array.from(sensorIds);
      const existingIndex = sensorIdArray.indexOf(sensorId);
      if (existingIndex > -1 && sensorIdArray.length > 1) {
        sensorIdArray.splice(existingIndex, 1);
        navigate({
          pathname: `/explore/${deviceId}/${sensorIdArray[0]}`,
          search: searchParams.toString(),
        });
        return;
      }
      // If it is, navigate to the explore route without that sensor
      navigate({
        pathname: `/explore/${deviceId}`,
        search: searchParams.toString(),
      });
      return;
    } else if (matches.length === 4 && sensorIds.size === 1) {
      navigate({
        pathname: `${matches[3].pathname}/${sensorId}`,
        search: searchParams.toString(),
      });
      return;
    } else if (sensorIds.size === 2) {
      toast({
        title: "Cant select more than 2 sensors",
        description: "Deselect one sensor to select another",
        variant: "destructive",
      });
      return;
    } else {
      // If not, navigate to the new route
      navigate({
        pathname: `/explore/${deviceId}/${sensorId}`,
        search: searchParams.toString(),
      });
    }
  };

  function handleDrag(_e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  const addLineBreaks = (text: string) =>
    text.split("\\n").map((text, index) => (
      <Fragment key={`${text}-${index}`}>
        {text}
        <br />
      </Fragment>
    ));

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
                    data.device.status === "active"
                      ? "h-4 w-4 rounded-full bg-light-green"
                      : "h-4 w-4 rounded-full bg-red-500"
                  }
                ></div>
                <div className="flex flex-1 text-center text-xl text-zinc-600 dark:dark:text-zinc-100">
                  {data.device.name}
                </div>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <EllipsisVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="dark:bg-dark-background dark:text-dark-text"
                  >
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={true}
                    >
                      <Scale className="mr-2 h-4 w-4" />
                      <span>Compare</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="mr-2 h-4 w-4" />
                      <span>
                        <a
                          href={getArchiveLink(data.device)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open archive"
                          className="w-full cursor-pointer"
                        >
                          Archive
                        </a>
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>
                        <a
                          href={data.device.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open external link"
                          className="w-full cursor-pointer"
                        >
                          External Link
                        </a>
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Minus
                  className="cursor-pointer"
                  onClick={() => setOpen(false)}
                />
                <X
                  className="cursor-pointer"
                  onClick={() => {
                    navigate({
                      pathname: "/explore",
                      search: searchParams.toString(),
                    });
                  }}
                />
              </div>
              <div className="no-scrollbar relative flex-1 overflow-y-scroll">
                <div className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                  <div className="md:w-1/2">
                    {data.device.image ? (
                      <img
                        className="w-full object-cover rounded-lg"
                        alt="device_image"
                        src={data.device.image}
                      ></img>
                    ) : (
                      <div className="w-full object-cover rounded-lg text-muted-foreground">
                        <ImageIcon strokeWidth={1} className="w-full h-full" />
                      </div>
                    )}
                  </div>
                  <div className="sm:w-1/2 space-y-2">
                    <InfoItem
                      icon={LandPlot}
                      title="Exposure"
                      text={data.device.exposure}
                    />
                    <InfoItem
                      icon={Cpu}
                      title="Sensor Model"
                      text={data.device.sensorWikiModel}
                    />
                    <Separator className="my-2" />
                    <InfoItem
                      icon={Rss}
                      title="Last Updated"
                      text={format(new Date(data.device.updatedAt), "PPP")}
                    />
                    <Separator className="my-2" />
                    <InfoItem
                      icon={CalendarPlus}
                      title="Created At"
                      text={format(new Date(data.device.createdAt), "PPP")}
                    />
                  </div>
                </div>
                {data.device.tags?.length > 0 && (
                  <div className="pt-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Tags
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-wrap gap-2">
                          {data.device.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs font-medium"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <Separator className="my-4"></Separator>
                {data.device.logEntries.length > 0 && (
                  <>
                    <EntryLogs entryLogs={data.device.logEntries} />
                    <Separator className="my-4" />
                  </>
                )}
                {data.device.description && (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue={"item-1"}
                  >
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="font-bold dark:dark:text-zinc-100">
                        Description
                      </AccordionTrigger>
                      <AccordionContent>
                        {addLineBreaks(data.device.description)}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
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
                      <div
                        className={
                          navigation.state === "loading"
                            ? "pointer-events-none"
                            : ""
                        }
                      >
                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                          {sensors &&
                            sensors.map((sensor: SensorWithMeasurement) => {
                              return (
                                <Card
                                  key={sensor.id}
                                  className={
                                    sensorIds.has(sensor.id)
                                      ? "bg-green-100 dark:bg-dark-green"
                                      : "hover:bg-muted"
                                  }
                                  onClick={() => handleSensorClick(sensor.id)} // Update to handle click
                                >
                                  <label
                                    htmlFor={sensor.id}
                                    className="cursor-pointer"
                                  >
                                    <input
                                      className="peer hidden"
                                      disabled={
                                        !sensorIds.has(sensor.id) &&
                                        sensorIds.size >= 2
                                          ? true
                                          : false
                                      }
                                      type="checkbox"
                                      name="sensor"
                                      id={sensor.id}
                                      value={sensor.id}
                                      defaultChecked={sensorIds.has(sensor.id)}
                                    />
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
                                              ? "h-2 w-2 rounded-full bg-light-green"
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
                                    </CardFooter>
                                  </label>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </Draggable>
      )}
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
    </>
  );
}

const InfoItem = ({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text?: string;
}) =>
  text && (
    <div className="space-y-1">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="flex items-center space-x-2 text-sm">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span>{text}</span>
      </div>
    </div>
  );
