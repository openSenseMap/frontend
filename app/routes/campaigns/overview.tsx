import { LinksFunction, LoaderArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import {
  ChevronDown,
  FilterXIcon,
  AlertCircleIcon,
  ArrowDownAZIcon,
} from "lucide-react";
// import Header from "./header";
import { Map } from "~/components/Map";
import { getCampaigns } from "~/models/campaign.server";
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
import { BBox } from "geojson";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PointLayer from "~/components/campaigns/overview/point-layer";
import { getPhenomena } from "~/models/phenomena.server";
import FiltersModal from "~/components/campaigns/overview/filters-modal";
import FiltersBar from "~/components/campaigns/overview/filters-bar";
// import h337, { Heatmap } from "heatmap.js";
// import fs from "fs";

export async function loader({ params }: LoaderArgs) {
  const campaigns = await getCampaigns();
  const phenos = await getPhenomena();
  if (phenos.code === "UnprocessableEntity") {
    throw new Response("Phenomena not found", { status: 502 });
  }
  const phenomena = phenos.map(
    (d: { label: { item: { text: any }[] } }) => d.label.item[0].text
  );
  // const data = await campaigns.json();
  // if (data.code === "UnprocessableEntity") {
  //   throw new Response("Campaigns not found", { status: 502 });
  // }
  return json({ campaigns, phenomena });
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
  const campaigns = data.campaigns;
  const phenomena = data.phenomena;
  // const [mapLoaded, setMapLoaded] = useState(false);
  // const [markers, setMarkers] = useState<Array<PointFeature<PointProperties>>>(
  //   []
  // );
  const [phenomenaState, setPhenomenaState] = useState(
    Object.fromEntries(phenomena.map((p: string) => [p, false]))
  );
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [phenomenaDropdown, setPhenomenaDropdownOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [country, setCountry] = useState("");
  const [exposure, setExposure] = useState("");
  const [selectedMarker, setSelectedMarker] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [urgency, setUrgency] = useState("");
  const [displayedCampaigns, setDisplayedCampaigns] = useState([]);
  const mapRef = useRef<MapRef>(null);
  const [mapBounds, setMapBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(1);
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
      console.log(mapBounds);
    }

    // Update the bounds whenever the viewport changes
    // const handleViewportChange = () => {
    //   const bounds = map.getBounds();
    //   setMapBounds(bounds);
    // };

    // // Attach the event listener for viewport change
    // map.on('render', handleViewportChange);

    // // Clean up the event listener when the component unmounts
    // return () => {
    //   map.off('render', handleViewportChange);
    // };
  }, [mapRef]);

  // const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const resetFilters = () => {
    setUrgency("");
    setSortBy("");
    const allCampaigns = campaigns.map((campaign: any) => {
      return campaign;
    });
    setDisplayedCampaigns(allCampaigns as any);
    setSelectedCampaign("");
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [0, 0],
        duration: 1000,
        zoom: 1,
      });
    }
  };

  useEffect(() => {
    const filteredCampaigns = campaigns.slice().filter((campaign: any) => {
      const titleMatches = campaign.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const priorityMatches =
        !urgency || campaign.priority.toLowerCase() === urgency.toLowerCase();
      // const countryMatches = campaign.country === country.toLowerCase();
      return titleMatches && priorityMatches;
    });
    setDisplayedCampaigns(filteredCampaigns as any);
  }, [data, searchTerm, urgency]);

  useEffect(() => {
    let sortedCampaigns;

    switch (sortBy) {
      case "erstelldatum":
        sortedCampaigns = campaigns
          .slice()
          .sort((campaignA: any, campaignB: any) => {
            const createdAtA = new Date(campaignA.createdAt).getTime();
            const createdAtB = new Date(campaignB.createdAt).getTime();
            return createdAtA - createdAtB;
          });
        break;

      case "dringlichkeit":
        const priorityOrder = {
          URGENT: 0,
          HIGH: 1,
          MEDIUM: 2,
          LOW: 3,
        };

        sortedCampaigns = campaigns
          .slice()
          .sort((campaignA: any, campaignB: any) => {
            const priorityA =
              priorityOrder[campaignA.priority as keyof typeof priorityOrder];
            const priorityB =
              priorityOrder[campaignB.priority as keyof typeof priorityOrder];

            return priorityA - priorityB;
          });
        break;

      default:
        sortedCampaigns = campaigns.slice();
    }

    setDisplayedCampaigns(sortedCampaigns as any);
  }, [data, sortBy]);

  const centerpoints = campaigns
    .map((campaign: any) => {
      if (Object.keys(campaign.centerpoint).length != 0) {
        return {
          coordinates: campaign.centerpoint.geometry.coordinates,
          title: campaign.title,
          id: campaign.id,
        };
      }
      //   campaign.centerpoint &&
      //   campaign.centerpoint.geometry &&
      //   campaign.centerpoint.geometry.coordinates
      // ) {
      else {
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
        <input
          className="focus:ring-blue-400 mx-auto mt-5 w-1/3 rounded-md border border-gray-300 px-4 py-2 text-center text-lg focus:border-transparent focus:outline-none focus:ring-2"
          type="text"
          placeholder="Search campaigns"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <FiltersBar
          exposure={exposure}
          setExposure={setExposure}
          phenomena={phenomena}
          phenomenaState={phenomenaState}
          resetFilters={resetFilters}
          setPhenomenaState={setPhenomenaState}
          setShowMap={setShowMap}
          setSortBy={setSortBy}
          setUrgency={setUrgency}
          showMap={showMap}
          sortBy={sortBy}
          switchDisabled={campaigns.length === 0}
          urgency={urgency}
        />
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
              {displayedCampaigns.length} von {campaigns.length} Kampagnen
              werden angezeigt
            </span>
            {displayedCampaigns.map((item: any, index: number) => (
              <Card
                key={item.id}
                className={`w-[350px] ${index % 4 === 0 ? "clear-left" : ""}`} // 3 campaigns per row
              >
                <Link to={`../${item.slug}`}>
                  <CardHeader>
                    <CardTitle>
                      <div className="flex">
                        <span
                          className={clsx(
                            "flex w-fit flex-wrap rounded px-2 py-1 text-sm text-white",
                            {
                              "bg-red-500":
                                item.priority.toLowerCase() === "urgent",
                              "bg-yellow-500":
                                item.priority.toLowerCase() === "high",
                              "bg-blue-500":
                                item.priority.toLowerCase() === "medium",
                              "bg-green-500":
                                item.priority.toLowerCase() === "low",
                            }
                          )}
                        >
                          <ClockIcon className="h-4 w-4" /> {item.priority}
                        </span>
                        {item.exposure !== "UNKNOWN" && (
                          <span
                            className={clsx(
                              "ml-auto w-fit rounded px-2 py-1 text-sm text-white",
                              {
                                "bg-blue-200":
                                  item.exposure.toLowerCase() === "indoor",
                                "bg-orange-500":
                                  item.exposure.toLowerCase() === "mobile",
                                "bg-emerald-500":
                                  item.exposure.toLowerCase() === "outdoor",
                              }
                            )}
                          >
                            {item.exposure}
                          </span>
                        )}
                      </div>
                      <span className="mt-2 flex flex-wrap">
                        {item.title}
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
                      max={item.requiredParticipants}
                      value={item.participantCount}
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
                      <AccordionContent>{item.description}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardFooter>
              </Card>
            ))}
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
