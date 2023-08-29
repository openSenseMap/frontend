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
import { useTranslation } from "react-i18next";
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
import { ClientOnly } from "remix-utils";
import { MarkdownEditor } from "~/markdown.client";
import { getPhenomena } from "~/models/phenomena.server";
import PhenomenaSelect from "~/components/campaigns/phenomena-select";
import YouTube, { YouTubeProps } from "react-youtube";

// import h337, { Heatmap } from "heatmap.js";

interface PhenomenaState {
  [phenomena: string]: boolean;
}

type PriorityType = keyof typeof Priority;
type ExposureType = keyof typeof Exposure;
// type FormData = z.infer<typeof campaignSchema>;

export async function action({ request }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  console.log(formData);
  const area = formData.get("feature") as any;
  const feature = area ? JSON.parse(area) : null;

  const turf_points = feature
    ? turf.points(feature.features[0]?.geometry?.coordinates[0])
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
  const instructions = formData.get("instructions");
  const begin = formData.get("startDate");
  const startDate =
    begin && typeof begin === "string" ? new Date(begin) : undefined;
  const end = formData.get("endDate");
  const endDate = end && typeof end === "string" ? new Date(end) : undefined;
  const createdAt = new Date();
  const updatedAt = new Date();
  const phenomenaString = formData.get("phenomena");
  let phenomena: string[] = [];
  if (typeof phenomenaString === "string") {
    phenomena = JSON.parse(phenomenaString);
  }

  const priority = formData.get("priority") as PriorityType;
  const exposure = formData.get("exposure") as ExposureType;
  const hardwareAvailable =
    formData.get("hardware_available") === "on" ? true : false;
  let minimumParticipants: FormDataEntryValue | number =
    formData.get("minimumParticipants") || 1;

  if (typeof minimumParticipants === "string") {
    minimumParticipants = parseInt(minimumParticipants);
  }

  const campaignData = {
    title,
    description,
    instructions,
    feature,
    priority,
    country,
    minimumParticipants: minimumParticipants,
    createdAt,
    updatedAt,
    startDate,
    endDate,
    phenomena,
    exposure,
    hardwareAvailable,
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
  const response = await getPhenomena();
  if (response.code === "UnprocessableEntity") {
    throw new Response("Phenomena not found", { status: 502 });
  }
  const phenomena = response.map((p: { slug: string }) => p.slug);
  return phenomena;
}

export default function CreateCampaign() {
  const actionData = useActionData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const phenomena = useLoaderData<typeof loader>();
  const { features } = useContext(FeatureContext);
  console.log(features);
  const textAreaRef = useRef();
  const [instructions, setInstructions] = useState<string | undefined>("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedPhenomena, setSelectedPhenomena] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const instructionsRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLInputElement>(null);
  const minimumParticipantsRef = useRef<HTMLInputElement>(null);
  const requiredSensorsRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const phenomenaRef = useRef<HTMLInputElement>(null);
  const exposureRef = useRef<HTMLInputElement>(null);
  const hardwareAvailableRef = useRef<HTMLButtonElement>(null);

  const { t } = useTranslation("campaign-form");

  const handleYoutubeUrlChange = (event: any) => {
    setYoutubeUrl(event.target.value);
  };

  const getYoutubeVideoId = (url: string) => {
    const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu.be\/)([\w-]+)/;
    const match = url.match(videoIdRegex);
    return match ? match[1] : undefined;
  };

  // const [container, setContainer] = useState<HTMLElement | undefined>(
  //   undefined
  // );
  // const [containerWrapper, setContainerWrapper] = useState<
  //   HTMLElement | undefined
  // >(undefined);

  // const heatMap = useRef<Heatmap<"value", "x", "y"> | null>(null);

  // useEffect(() => {
  //   if (typeof window != "undefined") {
  //     const container = document.getElementById("view")!;
  //     setContainer(container);
  //     const wrapper = document.getElementById("view-wrapper")!;
  //     setContainerWrapper(wrapper);
  //   }
  // }, []);

  // useEffect(() => {
  //   if (typeof window != "undefined") {
  //     var legendCanvas = document.createElement("canvas");
  //     legendCanvas.width = 100;
  //     legendCanvas.height = 10;
  //     var min = document.querySelector("#min");
  //     var max = document.querySelector("#max");
  //     var gradientImg = document.querySelector("#gradient");
  //     var legendCtx = legendCanvas.getContext("2d");
  //     var gradientCfg = {};

  //     function updateLegend(data: any) {
  //       // the onExtremaChange callback gives us min, max, and the gradientConfig
  //       // so we can update the legend
  //       min.innerHTML = data.min;
  //       max.innerHTML = data.max;
  //       // regenerate gradient image
  //       if (data.gradient != gradientCfg) {
  //         gradientCfg = data.gradient;
  //         var gradient = legendCtx.createLinearGradient(0, 0, 100, 1);
  //         for (var key in gradientCfg) {
  //           gradient.addColorStop(key, gradientCfg[key]);
  //         }
  //         legendCtx.fillStyle = gradient;
  //         legendCtx.fillRect(0, 0, 100, 10);
  //         gradientImg.src = legendCanvas.toDataURL();
  //       }
  //     }

  //     if (container) {
  //       heatMap.current = h337.create({
  //         container: container,
  //         onExtremaChange: function (data) {
  //           updateLegend(data);
  //         },
  //         radius: 15,
  //         maxOpacity: 0.5,
  //         minOpacity: 0.25,
  //         blur: 0.75,
  //       });
  //     }
  //     if (containerWrapper) {
  //       containerWrapper.onclick = function (ev: any) {
  //         if (heatMap.current) {
  //           heatMap.current.addData({
  //             x: ev.layerX,
  //             y: ev.layerY,
  //             value: 1,
  //           });
  //         }
  //       };
  //     }
  //   }
  // }, [container, containerWrapper]);

  // function to scroll to any field of the form
  const scrollToRef = (
    ref:
      | RefObject<HTMLInputElement>
      | RefObject<HTMLTextAreaElement>
      | RefObject<HTMLButtonElement>
      | RefObject<HTMLDivElement>
  ) => {
    if (ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    // do nothing if no error occured
    if (!actionData || !actionData.error) {
      return;
    }

    const { issues } = actionData.error;

    // do nothing if there are no issues
    if (!Array.isArray(issues) || issues.length === 0) {
      return;
    }

    const errorField = issues[0].path[0];

    // scroll to the field that causes the error
    switch (errorField) {
      case "title": {
        scrollToRef(titleRef);
        break;
      }
      case "description": {
        scrollToRef(descriptionRef);
        break;
      }
      case "instructions": {
        scrollToRef(instructionsRef);
        break;
      }
      case "priority": {
        scrollToRef(priorityRef);
        break;
      }
      case "minimumParticipants": {
        scrollToRef(minimumParticipantsRef);
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
        break;
      }
    }
    // changes whenever the form is submitted
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
      id="view-wrapper"
      className="flex min-h-full flex-col justify-center"
      onClick={(e: any) => {
        mouseData.push([e.clientX, e.clientY, 30]);
        localStorage.setItem("form", JSON.stringify(mouseData));
      }}
    >
      {/* <div id="heatmapLegend" className="absolute top-10 right-0 bg-white p-4">
        <h2>Legend</h2>
        <span className="float-left" id="min"></span>
        <span className="float-right" id="max"></span>
        <img className="w-full" id="gradient" src="" alt="legend-gradient" />
      </div> */}
      <div id="view" className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <label htmlFor="title">
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                {t("title")}
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
            <label htmlFor="description">
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                {t("description")}
              </span>
            </label>
            <div className="mt-1">
              <input
                ref={descriptionRef}
                id="description"
                required
                autoFocus={true}
                name="description"
                type="description"
                autoComplete="description"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="description-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].path[0] === "description" && (
                <div className="pt-1 text-red-500" id="email-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="instructions" className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                {t("Instructions")}
              </span>
              {InfoCard({
                content: (
                  <p>Geben Sie hier eine Anleitung für Ihre Teilnehmer</p>
                ),
              })}
            </label>
            <div className="mt-1" ref={instructionsRef}>
              <textarea
                className="hidden"
                value={instructions}
                name="instructions"
                id="instructions"
              ></textarea>
              <ClientOnly>
                {() => (
                  <>
                    {/* <input
                      type="text"
                      value={youtubeUrl}
                      onChange={handleYoutubeUrlChange}
                      placeholder="Enter YouTube URL"
                    /> */}
                    <MarkdownEditor
                      textAreaRef={textAreaRef}
                      comment={instructions}
                      setComment={setInstructions}
                    />

                    <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                      <span className="text-gray text-xs leading-4">
                        Bild hinzufügen
                      </span>
                      <span className="text-gray text-xs leading-4">
                        Markdown unterstützt
                      </span>
                    </div>
                  </>
                )}
              </ClientOnly>
              {/* <textarea
                id="instructions"
                ref={instructionsRef}
                name="instructions"
                // type="instructions"
                autoComplete="new-instructions"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="instructions-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              /> */}
              {actionData?.error?.issues[0].path[0] === "instructions" && (
                <div className="pt-1 text-red-500" id="instructions-error">
                  {actionData.error.issues[0].message}
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="priority" className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 ">
                {t("priority")}
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
              htmlFor="minimumParticipants"
              className="flex justify-between"
            >
              <span className="text-sm font-medium text-gray-700 ">
                {t("participants")}
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
                id="minimumParticipants"
                ref={minimumParticipantsRef}
                name="minimumParticipants"
                type="number"
                autoComplete="new-minimumParticipants"
                aria-invalid={
                  actionData?.error?.issues[0].message ? true : undefined
                }
                aria-describedby="minimumParticipants-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.issues[0].path[0] ===
                "minimumParticipants" && (
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
              {t("startDate")}
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
              className="block text-sm font-medium text-gray-700 "
            >
              {t("endDate")}
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
            <label
              htmlFor="phenomena"
              className="block text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']"
            >
              phenomena
            </label>
            <input
              id="phenomena"
              type="hidden"
              ref={phenomenaRef}
              name="phenomena"
              value={JSON.stringify(selectedPhenomena)}
            />
            <PhenomenaSelect
              phenomena={phenomena}
              setSelectedPhenomena={setSelectedPhenomena}
            />
            {/* <DropdownMenu
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
                {phenomena.map((p: string) => {
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
                      onSelect={(event: any) => event.preventDefault()}
                    >
                      {p}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
          <div>
            <label
              htmlFor="exposure"
              className="block text-sm font-medium text-gray-700"
            >
              {t("exposure")}
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
              {t("hardware_available")}
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
            <span>No</span>
            <Switch
              id="hardware_available"
              ref={hardwareAvailableRef}
              name="hardware_available"
            />
            <span>Yes</span>
          </div>

          {/* <input type="hidden" name="redirectTo" value={redirectTo} /> */}
          <button
            type="submit"
            className="hover:bg-blue-600 focus:bg-blue-400 w-full  rounded bg-blue-500 px-4 py-2 text-white"
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
