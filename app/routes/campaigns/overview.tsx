import { ActionArgs, LinksFunction, LoaderArgs, json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Switch } from "~/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// import Header from "./header";
import { Map } from "~/components/Map";
import { getCampaignCount, getCampaigns } from "~/models/campaign.server";
import {
  Layer,
  LngLatBounds,
  MapLayerMouseEvent,
  MapProvider,
  MapRef,
  MapboxEvent,
  Marker,
  Source,
} from "react-map-gl";
import { Progress } from "~/components/ui/progress";
import { CountryFlagIcon } from "~/components/ui/country-flag";
import type { BBox } from "geojson";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PointLayer from "~/components/campaigns/overview/point-layer";
import { getPhenomena } from "~/models/phenomena.server";
// import FiltersBar from "~/components/campaigns/overview/filters-bar";
import type { Campaign, Exposure, Priority, Prisma } from "@prisma/client";
import {
  ExposureBadge,
  PriorityBadge,
} from "~/components/campaigns/overview/campaign-badges";
import Markdown from "markdown-to-jsx";
import Pagination from "~/components/campaigns/overview/pagination";
import { Button } from "~/components/ui/button";
import Filter from "~/components/campaigns/overview/filter";
import { StarIcon } from "lucide-react";
import { requireUserId } from "~/session.server";
import { bookmark } from "~/lib/actions";
import { generateWhereObject } from "~/components/campaigns/overview/where-query";
// import h337, { Heatmap } from "heatmap.js";
// import fs from "fs";

const PER_PAGE = 12;

export async function action(args: ActionArgs) {
  return bookmark(args);
}

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const query = url.searchParams;
  const currentPage = Math.max(Number(query.get("page") || 1), 1);
  const options: {
    take: number;
    skip: number;
    orderBy: [{}, {}];
    where?: {};
  } = {
    take: PER_PAGE,
    skip: (currentPage - 1) * PER_PAGE,
    orderBy: [
      {
        bookmarkedByUsers: {
          _count: "desc",
        },
      },
      {
        updatedAt: "desc",
      },
    ],
    where: generateWhereObject(query),
  };

  const countOptions = options.where;

  if (query.get("sortBy")) {
    const sortBy = query.get("sortBy") || "updatedAt";
    options.orderBy.push({
      [sortBy]: "desc",
    });
  }

  const campaigns = await getCampaigns(options, userId);
  const campaignCount = await getCampaignCount();
  const phenos = await getPhenomena();
  if (phenos.code === "UnprocessableEntity") {
    throw new Response("Phenomena not found", { status: 502 });
  }
  const phenomena = phenos.map((p: { slug: string }) => p.slug);
  // const data = await campaigns.json();
  // if (data.code === "UnprocessableEntity") {
  //   throw new Response("Campaigns not found", { status: 502 });
  // }
  return json({ campaigns, campaignCount, phenomena, userId });
}
export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
  ];
};

export default function Campaigns() {
  const data = useLoaderData<typeof loader>();
  const { t } = useTranslation("overview");
  const campaigns = data.campaigns as unknown as Campaign[];
  const phenomena = data.phenomena;
  const campaignCount = data.campaignCount;
  const userId = data.userId;
  const totalPages = Math.ceil(campaignCount / PER_PAGE);
  // const [mapLoaded, setMapLoaded] = useState(false);
  // const [markers, setMarkers] = useState<Array<PointFeature<PointProperties>>>(
  //   []
  // );

  const [searchParams] = useSearchParams();

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [phenomenaDropdown, setPhenomenaDropdownOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [exposure, setExposure] = useState("");
  const [selectedMarker, setSelectedMarker] = useState("");
  const [showMap, setShowMap] = useState(false);
  // const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [priority, setpriority] = useState("");
  const [displayedCampaigns, setDisplayedCampaigns] = useState<Campaign[]>([]);
  const mapRef = useRef<MapRef>(null);
  const [mapBounds, setMapBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(1);
  const [filterObject, setFilterObject] = useState({
    searchTerm: "",
    priority: "",
    country: "",
    exposure: "",
    phenomena: [] as string[],
    time_range: {
      startDate: "",
      endDate: "",
    },
  });
  // const [container, setContainer] = useState<HTMLElement | undefined>(
  //   undefined
  // );
  // const [containerWrapper, setContainerWrapper] = useState<
  //   HTMLElement | undefined
  // >(undefined);
  const mouseData: any[][] = [];

  // const convertedData = testData.map(([x, y, value]) => ({
  //   x,
  //   y,
  //   value,
  // })) as readonly h337.DataPoint<"value", "x", "y">[];
  // console.log(convertedData);

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
  //         radius: 25,
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

  useEffect(() => {
    // Access the map instance when the component mounts
    const map = mapRef?.current?.getMap();
    if (map) {
      const bounds = map.getBounds().toArray().flat();
      setMapBounds(bounds as BBox);
    }
  }, [mapRef]);

  // const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const resetFilters = () => {
    setFilterObject({
      searchTerm: "",
      priority: "",
      country: "",
      exposure: "",
      phenomena: [],
      time_range: {
        startDate: "",
        endDate: "",
      },
    });
    // const allCampaigns = campaigns.map((campaign: Campaign) => {
    //   return campaign;
    // });
    // setDisplayedCampaigns(allCampaigns);
    setSelectedCampaign("");
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [0, 0],
        duration: 1000,
        zoom: 1,
      });
    }
  };

  // CLIENT-SIDE FILTERING IS REPLACED BY SERVER-SIDE FILTER FOR NOW

  // const checkTitleMatch = useCallback(
  //   (title: string) => {
  //     return title
  //       .toLowerCase()
  //       .includes(filterObject.searchTerm.toLowerCase());
  //   },
  //   [filterObject.searchTerm]
  // );

  // const checkPriorityMatch = useCallback(
  //   (priority: string) => {
  //     return (
  //       !filterObject.priority ||
  //       priority.toLowerCase() === filterObject.priority.toLowerCase()
  //     );
  //   },
  //   [filterObject.priority]
  // );

  // const checkCountryMatch = useCallback(
  //   (country: string | null) => {
  //     if (!country) {
  //       return true;
  //     }
  //     return (
  //       !filterObject.country ||
  //       country.toLowerCase() === filterObject.country.toLowerCase()
  //     );
  //   },
  //   [filterObject.country]
  // );

  // const checkExposureMatch = useCallback(
  //   (exposure: string) => {
  //     return (
  //       !filterObject.exposure ||
  //       exposure.toLowerCase() === filterObject.exposure.toLowerCase()
  //     );
  //   },
  //   [filterObject.exposure]
  // );

  // const checkTimeRangeMatches = useCallback(
  //   (startDate: Date | null, endDate: Date | null) => {
  //     const filterStartDate = filterObject.time_range.startDate;
  //     const filterEndDate = filterObject.time_range.endDate;

  //     if (!filterStartDate || !filterEndDate) {
  //       return true;
  //     }

  //     if (!startDate) {
  //       return false;
  //     }

  //     if (!endDate) {
  //       return false;
  //     }

  //     const campaignStartTimestamp = new Date(startDate).getTime();
  //     const campaignEndTimestamp = new Date(endDate).getTime();
  //     const filterStartTimestamp = new Date(filterStartDate).getTime();
  //     const filterEndTimestamp = new Date(filterEndDate).getTime();

  //     const isStartDateWithinRange =
  //       campaignStartTimestamp >= filterStartTimestamp &&
  //       campaignStartTimestamp <= filterEndTimestamp;

  //     const isEndDateWithinRange =
  //       campaignEndTimestamp >= filterStartTimestamp &&
  //       campaignEndTimestamp <= filterEndTimestamp;

  //     return isStartDateWithinRange && isEndDateWithinRange;
  //   },
  //   [filterObject.time_range]
  // );

  // const checkPhenomenaMatch = useCallback(
  //   (phenomena: string[]) => {
  //     const filterPhenomena: string[] = filterObject.phenomena;

  //     if (filterPhenomena.length === 0) {
  //       return true;
  //     }

  //     const hasMatchingPhenomena = phenomena.some((phenomenon) =>
  //       filterPhenomena.includes(phenomenon)
  //     );

  //     return hasMatchingPhenomena;
  //   },
  //   [filterObject.phenomena]
  // );

  // useEffect(() => {
  //   console.log(filterObject);
  //   const filteredCampaigns = campaigns.slice().filter((campaign: Campaign) => {
  //     const titleMatches = checkTitleMatch(campaign.title);
  //     const priorityMatches = checkPriorityMatch(campaign.priority);
  //     const countryMatches = checkCountryMatch(campaign.country);
  //     const exposureMatches = checkExposureMatch(campaign.exposure);
  //     const timeRangeMatches = checkTimeRangeMatches(
  //       campaign.startDate,
  //       campaign.endDate
  //     );
  //     // const phenomenaMatches = checkPhenomenaMatch(campaign.phenomena);
  //     return (
  //       titleMatches &&
  //       priorityMatches &&
  //       countryMatches &&
  //       exposureMatches &&
  //       timeRangeMatches
  //       // phenomenaMatches
  //     );
  //   });
  //   setDisplayedCampaigns(filteredCampaigns);
  // }, [
  //   campaigns,
  //   checkCountryMatch,
  //   checkExposureMatch,
  //   checkPriorityMatch,
  //   checkTitleMatch,
  //   checkTimeRangeMatches,
  //   // checkPhenomenaMatch,
  //   filterObject,
  // ]);

  // useEffect(() => {
  //   let sortedCampaigns;

  //   switch (sortBy) {
  //     case "erstelldatum":
  //       sortedCampaigns = campaigns
  //         .slice()
  //         .sort((campaignA: Campaign, campaignB: Campaign) => {
  //           const createdAtA = new Date(campaignA.createdAt).getTime();
  //           const createdAtB = new Date(campaignB.createdAt).getTime();
  //           return createdAtA - createdAtB;
  //         });
  //       break;

  //     case "dringlichkeit":
  //       const priorityOrder = {
  //         URGENT: 0,
  //         HIGH: 1,
  //         MEDIUM: 2,
  //         LOW: 3,
  //       };

  //       sortedCampaigns = campaigns
  //         .slice()
  //         .sort((campaignA: Campaign, campaignB: Campaign) => {
  //           const priorityA =
  //             priorityOrder[campaignA.priority as keyof typeof priorityOrder];
  //           const priorityB =
  //             priorityOrder[campaignB.priority as keyof typeof priorityOrder];

  //           return priorityA - priorityB;
  //         });
  //       break;

  //     default:
  //       sortedCampaigns = campaigns.slice();
  //   }

  //   setDisplayedCampaigns(sortedCampaigns);
  // }, [campaigns, sortBy]);

  const centerpoints = campaigns
    .map((campaign: Campaign) => {
      if (
        typeof campaign.centerpoint === "object" &&
        campaign.centerpoint !== null &&
        "geometry" in campaign.centerpoint
      ) {
        const centerObject = campaign.centerpoint as Prisma.JsonObject;
        const geometryObject = centerObject.geometry as Prisma.JsonObject;
        if (centerObject && geometryObject) {
          return {
            coordinates: geometryObject.coordinates,
            title: campaign.title,
            id: campaign.id,
          };
        }
      } else {
        return null;
      }
    })
    .filter((coords) => coords !== null);

  const handleMapLoad = useCallback(() => {
    const map = mapRef?.current?.getMap();
    if (map) {
      setMapBounds(map.getBounds().toArray().flat() as BBox);
    }
  }, []);

  return (
    <div
      id="view-wrapper"
      onClick={(e: any) => {
        mouseData.push([e.pageX, e.pageY, 30]);
        console.log(mouseData);
        localStorage.setItem("overview", JSON.stringify(mouseData));
      }}
      // className="flex flex-col "
    >
      <div id="view" className="flex flex-col">
        {/* <Header /> */}
        {/* <Link to={"./create"} className="ml-auto mt-2 mr-2">
        <Button size="lg" className="bg-green-300 text-lg ">
          Erstellen
        </Button>
      </Link> */}
        {/* <div
          id="heatmapLegend"
          className="absolute top-10 right-0 bg-white p-4"
        >
          <h2>Legende</h2>
          <span className="float-left" id="min"></span>
          <span className="float-right" id="max"></span>
          <img className="w-full" id="gradient" src="" alt="legend-gradient" />
        </div> */}
        <Filter
          setShowMap={setShowMap}
          showMap={showMap}
          switchDisabled={campaigns.length === 0}
          phenomena={phenomena}
        />
        {/* <FiltersBar
          phenomena={phenomena}
          phenomenaState={phenomenaState}
          resetFilters={resetFilters}
          setPhenomenaState={setPhenomenaState}
          setShowMap={setShowMap}
          setSortBy={setSortBy}
          filterObject={filterObject}
          setFilterObject={setFilterObject}
          showMap={showMap}
          sortBy={sortBy}
          switchDisabled={campaigns.length === 0}
        /> */}
        {selectedCampaign && (
          <div className="relative ml-auto inline-block">
            <input type="text" value={selectedCampaign.split("-")[0]} />
            <XMarkIcon
              onClick={() => {
                setSelectedCampaign("");
                resetFilters();
                mapRef.current?.flyTo({
                  center: [0, 0],
                  duration: 1000,
                  zoom: 1,
                });
              }}
              className="absolute right-2 top-2 ml-auto h-5 w-5"
            />
          </div>
        )}
      </div>
      <hr className="w-full bg-gray-700" />
      {campaigns.length === 0 ? (
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <span className="mt-6 text-red-500">{t("no campaigns yet")}. </span>{" "}
          <div>
            {t("click")}{" "}
            <Link className="text-blue-500 underline" to="../../create/area">
              {t("here")}
            </Link>{" "}
            {t("to create a campaign")}
          </div>
        </div>
      ) : (
        <div className="relative flex w-full justify-between">
          <div
            className={`${
              showMap
                ? "mx-auto mt-10 flex flex-col gap-4"
                : "mt-10 flex w-full flex-wrap gap-4"
            }`}
          >
            <span className="absolute left-0 top-0 ">
              {campaigns.length} von {campaignCount} Kampagnen werden angezeigt
            </span>
            {campaigns.map((item: Campaign, index: number) => (
              <Card
                key={item.id}
                className={`w-[350px] ${index % 4 === 0 ? "clear-left" : ""}`} // 3 campaigns per row
              >
                <Link to={`../${item.slug}`}>
                  <CardHeader>
                    <CardTitle>
                      <div className="mb-4 flex w-full justify-between">
                        <div>
                          <Form method="post">
                            <input
                              className="hidden"
                              name="campaignId"
                              id="campaignId"
                              value={item.id}
                            />
                            <button
                              type="submit"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {userId &&
                              item.bookmarkedByUsers.some(
                                (user) => user.id === userId
                              ) ? (
                                <StarIcon className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                              ) : (
                                <StarIcon className="h-4 w-4" />
                              )}
                            </button>
                          </Form>
                        </div>
                        <div className="flex gap-2">
                          <ExposureBadge exposure={item.exposure} />
                          <PriorityBadge priority={item.priority} />
                        </div>
                      </div>
                      <span className="flex justify-between">
                        {item.title}{" "}
                        {item.country && (
                          <CountryFlagIcon
                            country={String(item.country).toUpperCase()}
                          />
                        )}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mt-2">
                    <Progress
                      max={item.requiredParticipants ?? 0}
                      value={item.participants.length}
                      // onMouseEnter={}
                    />
                    <span>
                      {item.requiredParticipants} {t("total participants")}
                    </span>
                  </CardContent>
                </Link>
                <CardFooter>
                  <Accordion className="w-full" type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-blue-600 hover:text-blue-800">
                        {t("learn more")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Markdown>{item.description}</Markdown>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardFooter>
              </Card>
            ))}
            {totalPages > 1 && (
              <Pagination
                totalPages={totalPages}
                pageParam="page"
                className="mt-8 w-full"
              />
            )}
          </div>
          <div>
            {showMap && (
              <MapProvider>
                <Map
                  initialViewState={{
                    latitude: 51,
                    longitude: 7,
                    zoom: 1,
                  }}
                  interactiveLayerIds={["marker-layer"]}
                  // preserveDrawingBuffer
                  // onMouseMove={handleMapMouseMove}
                  // onClick={handleMapClick}
                  onLoad={handleMapLoad}
                  onZoom={(e) => setZoom(Math.floor(e.viewState.zoom))}
                  ref={mapRef}
                  style={{
                    height: "60vh",
                    width: "40vw",
                    position: "sticky",
                    top: 0,
                    marginLeft: "auto",
                  }}
                >
                  {centerpoints.length > 0 && (
                    <PointLayer
                      //@ts-ignore
                      centerpoints={centerpoints}
                      setDisplayedCampaigns={setDisplayedCampaigns}
                      setSelectedCampaign={setSelectedCampaign}
                      setSelectedMarker={setSelectedMarker}
                      campaigns={campaigns}
                    />
                  )}
                </Map>
              </MapProvider>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
