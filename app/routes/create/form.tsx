import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
import type { ActionArgs, FormData, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefObject, useContext, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { ChevronDown, InfoIcon } from "lucide-react";
import { createCampaign } from "~/models/campaign.server";
import { requireUserId } from "~/session.server";
import { FeatureContext } from "../create";
import { Exposure } from "@prisma/client";
import { Priority } from "@prisma/client";
import * as turf from "@turf/helpers";
import center from "@turf/center";
import { campaignSchema } from "~/lib/validations/campaign";
import { Switch } from "@/components/ui/switch";
import { useToast } from "~/components/ui/use-toast";
import { useNavigate } from "@remix-run/react";
import { reverseGeocode } from "~/components/Map/geocoder-control";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoCard } from "~/utils/info-card";

interface PhenomenaState {
  [phenomena: string]: boolean;
}

type PriorityType = keyof typeof Priority;
type ExposureType = keyof typeof Exposure;
// type FormData = z.infer<typeof campaignSchema>;

export async function action({ request }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  const area = formData.get("feature") as any;
  const feature = area ? JSON.parse(area) : null;
  const turf_points = feature
    ? turf.points(feature[0]?.geometry?.coordinates[0])
    : null;
  const centerpoint = turf_points ? center(turf_points) : {};

  // if (feature?.properties?.centerpoint) {
  //   centerpoint = {
  //     type: "Feature",
  //     geometry: {
  //       type: "Point",
  //       coordinates: feature.properties.centerpoint,
  //     },
  //   };
  // } else {
  //   const turf_points = feature
  //     ? turf.points(feature[0]?.geometry?.coordinates[0])
  //     : null;
  //   centerpoint = turf_points ? center(turf_points) : {};
  // }

  let country = "";
  if (centerpoint) {
    //@ts-ignore
    const lat = centerpoint.geometry.coordinates[0];
    //@ts-ignore
    const lng = centerpoint.geometry.coordinates[1];

    const country_code = await reverseGeocode(lng, lat);
    console.log(country_code);
    if (country_code) {
      country = country_code as string;
    }
  }

  const title = formData.get("title");
  const description = formData.get("description");
  const begin = formData.get("startDate");
  const startDate =
    begin && typeof begin === "string" ? new Date(begin) : undefined;
  const end = formData.get("endDate");
  const endDate = end && typeof end === "string" ? new Date(end) : undefined;
  const createdAt = new Date();
  const updatedAt = new Date();
  const phenomenaString = formData.get("phenomena");
  let phenomenaState: PhenomenaState = {};
  if (typeof phenomenaString === "string") {
    phenomenaState = JSON.parse(phenomenaString);
  }
  const phenomena = Object.keys(phenomenaState).filter(
    (key) => phenomenaState[key]
  );

  const priority = formData.get("priority") as PriorityType;
  const exposure = formData.get("exposure") as ExposureType;
  const hardware_available =
    formData.get("hardware_available") === "on" ? true : false;
  let requiredParticipants: FormDataEntryValue | number =
    formData.get("requiredParticipants") || 1;
  let requiredSensors: FormDataEntryValue | number =
    formData.get("requiredSensors") || 1;
  if (typeof requiredParticipants === "string") {
    requiredParticipants = parseInt(requiredParticipants);
  }
  if (typeof requiredSensors === "string") {
    requiredSensors = parseInt(requiredSensors);
  }

  const campaignData = {
    title,
    description,
    feature,
    priority,
    country,
    participantCount: 0,
    requiredParticipants: requiredParticipants,
    requiredSensors: requiredSensors,
    createdAt,
    updatedAt,
    startDate,
    endDate,
    phenomena,
    exposure,
    hardware_available,
    centerpoint,
    owner: {
      id: ownerId,
    },
    ownerId,
  };

  try {
    const newCampaign = campaignSchema.parse(campaignData);
    const campaign = await createCampaign({
      ...newCampaign,
      feature: newCampaign.feature ?? {},
      endDate: newCampaign.endDate ?? null,
      centerpoint: newCampaign.centerpoint ?? {},
      country: newCampaign.country ?? null,
      ownerId,
    });

    return redirect("/campaigns/overview");
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

export async function loader({ params }: LoaderArgs) {
  // request to fetch all phenomena
  const response = await fetch(
    "https://api.sensors.wiki/phenomena/all?language=de"
  );
  const data = await response.json();
  if (data.code === "UnprocessableEntity") {
    throw new Response("Phenomena not found", { status: 502 });
  }
  const phenomena = data.map(
    (d: { label: { item: { text: any }[] } }) => d.label.item[0].text
  );
  return phenomena;
}

export default function CreateCampaign() {
  const actionData = useActionData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const phenomena = useLoaderData<typeof loader>();
  const { features } = useContext(FeatureContext);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priorityRef = useRef<HTMLInputElement>(null);
  const requiredParticipantsRef = useRef<HTMLInputElement>(null);
  const requiredSensorsRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const phenomenaRef = useRef<HTMLInputElement>(null);
  const exposureRef = useRef<HTMLInputElement>(null);
  const hardwareAvailableRef = useRef<HTMLButtonElement>(null);

  const scrollToRef = (
    ref:
      | RefObject<HTMLInputElement>
      | RefObject<HTMLTextAreaElement>
      | RefObject<HTMLButtonElement>
  ) => {
    if (ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (!actionData || !actionData.error) {
      return;
    }

    const { issues } = actionData.error;

    if (!Array.isArray(issues) || issues.length === 0) {
      return;
    }

    const errorField = issues[0].path[0];

    switch (errorField) {
      case "title": {
        scrollToRef(titleRef);
        break;
      }
      case "description": {
        scrollToRef(descriptionRef);
        break;
      }
      case "priority": {
        scrollToRef(priorityRef);
        break;
      }
      case "requiredParticipants": {
        scrollToRef(requiredParticipantsRef);
        break;
      }
      case "requiredSensors": {
        scrollToRef(requiredSensorsRef);
        break;
      }
      case "startDate": {
        scrollToRef(startDateRef);
        break;
      }
      case "endDate": {
        scrollToRef(endDateRef);
        break;
      }
      case "phenomena": {
        scrollToRef(phenomenaRef);
        break;
      }
      case "exposure": {
        scrollToRef(exposureRef);
        break;
      }
      case "hardware_available": {
        scrollToRef(hardwareAvailableRef);
        break;
      }
      default: {
        //statements;
        break;
      }
    }
  }, [actionData]);

  useEffect(() => {
    if (Object.keys(features).length === 0) {
      navigate("../area");
      toast({
        title: "Missing specified area",
        description: "Please specify area of interest first",
      });
    }
  }, []);
  const [phenomenaState, setPhenomenaState] = useState(
    Object.fromEntries(phenomena.map((p: string) => [p, false]))
  );
  const [priority, setPriority] = useState("MEDIUM");
  const [exposure, setExposure] = useState("UNKNOWN");
  const [openDropdown, setDropdownOpen] = useState(false);
  const mouseData: any[][] = [];
  // useEffect(() => {
  //   if (container) {
  //     heatMap.current = h337.create({
  //       container: container,
  //       maxOpacity: 0.6,
  //       radius: 50,
  //       blur: 0.9,
  //     });
  //     heatMap.current.setData({
  //       min: 0,
  //       max: 100,
  //       data: convertedData,
  //     });
  //   }
  // }, [container, convertedData]);
  return (
    <div
      className="flex min-h-full flex-col justify-center"
      onClick={(e: any) => {
        mouseData.push([e.clientX, e.clientY, 30]);
        localStorage.setItem("form", JSON.stringify(mouseData));
      }}
    >
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <label htmlFor="title">
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                Titel
              </span>
            </label>
            <div className="mt-1">
              <input
                ref={titleRef}
                id="title"
                required
                autoFocus={true}
                name="title"
                type="title"
                autoComplete="title"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="title-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].path[0] === "title" && (
                <div className="pt-1 text-red-500" id="email-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>
          <input
            id="feature"
            value={JSON.stringify(features)}
            name="feature"
            type="text"
            className="hidden"
          />

          <div>
            <label htmlFor="description" className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                Beschreibung
              </span>
              {InfoCard({
                content: (
                  <p>Geben Sie hier eine Beschreibung für Ihre Kampagne</p>
                ),
              })}
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                ref={descriptionRef}
                name="description"
                // type="description"
                autoComplete="new-description"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="description-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].path[0] === "description" && (
                <div className="pt-1 text-red-500" id="description-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="priority" className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                Priority
              </span>
              {InfoCard({
                content: <p>Sezten Sie eine Priorität für Ihre Kampagne</p>,
              })}
            </label>
            <div className="mt-1">
              <input
                id="priority"
                name="priority"
                ref={priorityRef}
                type="hidden"
                value={priority}
              />
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Priorities</SelectLabel>
                    {Object.keys(Priority).map((key: string) => {
                      return (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full" variant="outline">
                    {priority || "Priorität"}
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuRadioGroup
                    value={priority}
                    onValueChange={setPriority}
                  >
                    {Object.keys(Priority).map((key: string) => {
                      return (
                        <DropdownMenuRadioItem key={key} value={key}>
                          {key}
                        </DropdownMenuRadioItem>
                      );
                    })}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>
          </div>
          <div>
            <label
              htmlFor="requiredParticipants"
              className="flex justify-between"
            >
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                Gewünschte Teilnehmerzahl
              </span>
              {InfoCard({
                content: (
                  <p>
                    Wie viele Teilnehmer wünschen Sie sich im Idealfall führ
                    Ihre Kampagne
                  </p>
                ),
              })}
            </label>
            <div className="mt-1">
              <input
                id="requiredParticipants"
                ref={requiredParticipantsRef}
                name="requiredParticipants"
                type="number"
                min={1}
                autoComplete="new-requiredParticipants"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="requiredParticipants-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].path[0] ===
                "requiredParticipants" && (
                <div className="pt-1 text-red-500" id="description-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="requiredSensors" className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                Gewünschte Anzahl Sensoren
              </span>
              {InfoCard({
                content: (
                  <p>Wie viele Sensoren benötigen Sie für die Kampagne</p>
                ),
              })}
            </label>
            <div className="mt-1">
              <input
                id="requiredSensors"
                ref={requiredSensorsRef}
                min={1}
                name="requiredSensors"
                type="number"
                autoComplete="new-requiredSensors"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="requiredSensors-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].path[0] === "requiredSensors" && (
                <div className="pt-1 text-red-500" id="description-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']"
            >
              Beginn
            </label>
            <div className="mt-1">
              <input
                id="startDate"
                ref={startDateRef}
                name="startDate"
                type="date"
                autoComplete="new-startDate"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="startDate-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].path[0] === "startDate" && (
                <div className="pt-1 text-red-500" id="description-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']"
            >
              Abschluss
            </label>
            <div className="mt-1">
              <input
                id="endDate"
                ref={endDateRef}
                name="endDate"
                type="date"
                autoComplete="new-endDate"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="endDate-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].message ===
                "Start date must be earlier than End date." && (
                <div className="pt-1 text-red-500" id="description-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>
          <div>
            <input
              type="hidden"
              ref={phenomenaRef}
              name="phenomena"
              value={JSON.stringify(phenomenaState)}
            />
            <DropdownMenu
              open={openDropdown}
              onOpenChange={setDropdownOpen}
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button className="w-full truncate" variant="outline">
                  {Object.keys(phenomenaState)
                    .filter((key) => phenomenaState[key])
                    .join(", ")}
                  {Object.keys(phenomenaState).filter(
                    (key) => phenomenaState[key]
                  ).length > 0 ? (
                    <></>
                  ) : (
                    <span>Phänomene</span>
                  )}
                  <span className="text-red-500">&nbsp;*</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {phenomena.map((p: any) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={p}
                      checked={phenomenaState[p]}
                      onCheckedChange={() => {
                        setPhenomenaState({
                          ...phenomenaState,
                          [p]: !phenomenaState[p],
                        });
                      }}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {p}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <label
              htmlFor="exposure"
              className="block text-sm font-medium text-gray-700"
            >
              Einsatzgebiet
            </label>
            <div className="mt-1">
              <input
                id="exposure"
                name="exposure"
                ref={exposureRef}
                type="hidden"
                value={exposure}
              />
              <Select value={exposure} onValueChange={setExposure}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an exposure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Exposures</SelectLabel>
                    {Object.keys(Exposure).map((key: string) => {
                      return (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full" variant="outline">
                  Einsatz <span className="text-red-500">&nbsp;*</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuRadioGroup
                  value={exposure}
                  onValueChange={setExposure}
                >
                  <DropdownMenuRadioItem value={"INDOOR"}>
                    Indoor
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={"MOBILE"}>
                    Mobil
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={"OUTDOOR"}>
                    Outdoor
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu> */}
            </div>
          </div>
          <label htmlFor="hardware_available" className="flex justify-between">
            <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
              Hardware verfügbar
            </span>
            {InfoCard({
              content: (
                <p>
                  Haben Sie die benötigte Hardware zur Verfügung oder sollten
                  die Teilnehmer eigene Hardware stellen
                </p>
              ),
            })}
          </label>
          <div className="flex w-fit justify-between gap-2">
            <span>Nein</span>
            <Switch
              id="hardware_available"
              ref={hardwareAvailableRef}
              name="hardware_available"
            />
            <span>Ja</span>
          </div>

          {/* <input type="hidden" name="redirectTo" value={redirectTo} /> */}
          <button
            type="submit"
            className="hover:bg-blue-600 focus:bg-blue-400 w-full  rounded bg-blue-500 py-2 px-4 text-white"
          >
            Create Campaign
          </button>
          <div className="flex items-center justify-center">
            <Link
              className="text-blue-500 underline"
              to={{
                pathname: "../../campaigns/overview",
              }}
            >
              Kampagnen Übersicht
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
