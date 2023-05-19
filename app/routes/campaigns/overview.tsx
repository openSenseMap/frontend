import { LinksFunction, LoaderArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ChevronDown } from "lucide-react";
// import Header from "./header";
import { Map } from "~/components/Map";
import { getCampaigns, updateCampaign } from "~/models/campaign.server";
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
import { CountryFlagIcon } from "~/components/ui/CountryFlag";
import { BBox, FeatureCollection } from "geojson";
import Supercluster, { AnyProps, PointFeature } from "supercluster";
import useSupercluster, { UseSuperclusterArgument } from "use-supercluster";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";

type PointProperties = {
  title: string;
  cluster: boolean;
  point_count: any;
  id: string;
};

export async function loader({ params }: LoaderArgs) {
  // request to API with deviceID
  const campaigns = await getCampaigns();
  // const data = await campaigns.json();
  // if (data.code === "UnprocessableEntity") {
  //   throw new Response("Campaigns not found", { status: 502 });
  // }
  return json(campaigns);
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
  // const [mapLoaded, setMapLoaded] = useState(false);
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    width: "100vw",
    height: "100vh",
    zoom: 1,
  });
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [urgency, setUrgency] = useState("");
  const [displayedCampaigns, setDisplayedCampaigns] = useState([]);
  const mapRef = useRef<MapRef>(null);
  const [mapBounds, setMapBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(1);
  // const [clusters, setClusters] = useState<
  //   (
  //     | Supercluster.PointFeature<Supercluster.AnyProps>
  //     | Supercluster.ClusterFeature<Supercluster.AnyProps>
  //   )[]
  // >([]);
  // const clusterLayer = {
  //   id: "clusters",
  //   type: "circle" as "sky",
  //   paint: {
  //     "circle-color": "#51bbd6",
  //     "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
  //   },
  // };

  // const clusterCountLayer = {
  //   id: "cluster-count",
  //   type: "symbol",
  //   layout: {
  //     "text-field": "{point_count_abbreviated}",
  //     "text-size": 12,
  //   },
  // };

  // const unclusteredPointLayer = {
  //   id: "unclustered-point",
  //   type: "circle",
  //   // source: 'points',
  //   filter: ["!", ["has", "point_count"]],
  //   paint: {
  //     "circle-color": "#11b4da",
  //     "circle-radius": 5,
  //     "circle-stroke-width": 1,
  //     "circle-stroke-color": "#fff",
  //   },
  // };

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
  };

  useEffect(() => {
    const filteredCampaigns = data.filter((campaign: any) => {
      const titleMatches = campaign.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const priorityMatches =
        !urgency || campaign.priority.toLowerCase() === urgency.toLowerCase();
      return titleMatches && priorityMatches;
    });
    setDisplayedCampaigns(filteredCampaigns as any);
  }, [data, searchTerm, urgency]);

  // const sortedCampaigns = filteredCampaigns.sort((a: any, b: any) => {
  //   const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 }; // Define urgency priority order
  //   return (
  //     urgencyOrder[a.priority.toLowerCase() as keyof typeof urgencyOrder] -
  //     urgencyOrder[b.priority.toLowerCase() as keyof typeof urgencyOrder]
  //   );
  // });

  const centerpoints = data
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

  // const markerGeoJSOn = {
  //   type: "FeatureCollection",
  //   features: centerpoints.map((point) => ({
  //     type: "Feature",
  //     geometry: {
  //       type: "Point",
  //       coordinates: point?.coordinates,
  //     },
  //     properties: {
  //       title: `${point?.title}`,
  //     },
  //   })),
  // };

  const points: Array<PointFeature<PointProperties>> = centerpoints.map(
    (point) => ({
      type: "Feature",
      properties: {
        cluster: false,
        point_count: 1,
        title: point?.title,
        id: point?.id,
      },
      geometry: {
        type: "Point",
        coordinates: point?.coordinates,
      },
    })
  );

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: mapBounds,
    zoom: zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  // const supercluster = useMemo(() => {
  //   return new Supercluster({
  //     radius: 40, // Adjust the radius as needed for clustering
  //     maxZoom: 16, // Adjust the maxZoom as needed for clustering
  //   });
  // }, []);

  // supercluster.load(markerGeoJSOn.features as any);

  useEffect(() => {
    // const supercluster = new Supercluster({
    //   radius: 40, // Adjust the radius as needed for clustering
    //   maxZoom: 16, // Adjust the maxZoom as needed for clustering
    // });
    // supercluster.load(markerGeoJSOn.features as any);
    // const zoomListener = () => {
    // const zoom = Math.floor(viewport.zoom);
    // if (mapBounds) {
    //   const clusters = supercluster.getClusters(
    //     [
    //       mapBounds.getWest(),
    //       mapBounds.getSouth(),
    //       mapBounds.getEast(),
    //       mapBounds.getNorth(),
    //     ], // Specify the map bounds for clustering
    //     zoom
    //   );
    //   // setClusters(clusters);
    // }
    // };
    // zoomListener();
    // window.addEventListener("resize", zoomListener);
    // return () => window.removeEventListener("resize", zoomListener);
  }, [mapBounds, supercluster, zoom]);

  const handleMarkerClick = useCallback(
    (markerId: string, latitude: number, longitude: number) => {
      const selectedCampaign = data.filter(
        (campaign: any) => campaign.id === markerId
      );
      setDisplayedCampaigns(selectedCampaign as any);
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        duration: 2000,
        zoom: 6,
      });
    },
    []
  );

  const handleClusterClick = useCallback(
    (latitude: number, longitude: number) => {
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        duration: 2000,
        zoom: zoom + 2, // maybe just hardcoaded number
      });
    },
    [zoom]
  );

  const handleMapLoad = useCallback(() => {
    const map = mapRef?.current?.getMap();
    if (map) {
      setMapBounds(map.getBounds().toArray().flat() as BBox);
    }
  }, []);

  // const handleMapClick = useCallback(
  //   (e: MapLayerMouseEvent) => {
  //     const { features } = e;
  //     if (features && features?.length != 0) {
  //       const title = features[0]?.properties?.title;
  //       let clickedCampaign = displayedCampaigns.filter(
  //         (c: any) => c.title === title
  //       );
  //       setDisplayedCampaigns(clickedCampaign);
  //     }
  //   },
  //   [displayedCampaigns]
  // );

  // const displayedCampaigns =
  //   sortBy === "dringlichkeit" ? sortedCampaigns : filteredCampaigns;

  return (
    <div className="flex flex-col ">
      {/* <Header /> */}
      {/* <Link to={"./create"} className="ml-auto mt-2 mr-2">
        <Button size="lg" className="bg-green-300 text-lg ">
          Erstellen
        </Button>
      </Link> */}
      <input
        className="focus:ring-blue-400 mx-auto mt-20 w-1/3 rounded-md border border-gray-300 px-4 py-2 text-center text-lg focus:border-transparent focus:outline-none focus:ring-2"
        type="text"
        placeholder="Search campaigns"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
      <div className="my-4 flex flex-row gap-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={"lg"}>
              Dringlichkeit{" "}
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuRadioGroup value={urgency} onValueChange={setUrgency}>
              <DropdownMenuRadioItem value="urgent">
                Urgent
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={"lg"}>
              Sortieren nach{" "}
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              <DropdownMenuRadioItem value="dringlichkeit">
                Dringlichkeit
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="erstellung">
                Erstellung
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant={"ghost"} size={"lg"} onClick={resetFilters}>
          Filter zurücksetzen
        </Button>
        <div>
          <span>Karte anzeigen</span>
          <Switch
            id="showMapSwitch"
            checked={showMap}
            onCheckedChange={() => setShowMap(!showMap)}
          />
        </div>
      </div>
      {data.length === 0 ? (
        <div>
          Zurzeit gibt es noch keine Kampagnen. Klicke hier um eine Kampagne zu
          erstellen
        </div>
      ) : (
        <div className="flex flex-wrap">
          {/* <div
            className={clsx("p-4", {
              "w-full": !showMap,
              "w-1/4 lg:w-3/4": showMap,
            })}
          > */}
          <div
            className={clsx("grid", {
              "grid-cols-3 gap-4": !showMap,
              "grid-cols-2 gap-3": showMap,
            })}
          >
            {displayedCampaigns.map((item: any) => (
              <Link key={item.id} to={`./${item.id}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <div className="flex flex-wrap">
                        <span className="flex flex-wrap">
                          {item.title}
                          <CountryFlagIcon country={String(item.country)} />
                        </span>
                        <div className="ml-auto">
                          <span
                            className={clsx(
                              "mr-2 w-fit rounded px-2 py-1 text-white",
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
                            {item.priority}
                          </span>
                          {item.exposure !== "UNKNOWN" && (
                            <span
                              className={clsx(
                                "w-fit rounded px-2 py-1 text-white",
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
                      </div>
                    </CardTitle>
                    <CardDescription>{item.keywords || ""}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      max={item.requiredParticipants}
                      value={item.participantCount}
                      // onMouseEnter={}
                    />
                  </CardContent>
                  <CardFooter>
                    <Accordion className="w-full" type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-blue-600 hover:text-blue-800">
                          Learn More
                        </AccordionTrigger>
                        <AccordionContent>{item.description}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
          {showMap && (
            <div className="ml-auto w-1/3">
              <MapProvider>
                <Map
                  initialViewState={viewport}
                  interactiveLayerIds={["marker-layer"]}
                  // preserveDrawingBuffer
                  // onMouseMove={handleMapMouseMove}
                  // onClick={handleMapClick}
                  onLoad={handleMapLoad}
                  onZoom={(e) => setZoom(Math.floor(e.viewState.zoom))}
                  ref={mapRef}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    // marginTop: "2rem",
                    marginLeft: "10px",
                    marginRight: "10px",
                  }}
                >
                  {clusters.map((cluster) => {
                    // every cluster point has coordinates
                    const [longitude, latitude] = cluster.geometry.coordinates;
                    // the point may be either a cluster or a crime point
                    const { cluster: isCluster, point_count: pointCount } =
                      cluster.properties;

                    // we have a cluster to render
                    if (isCluster) {
                      return (
                        <Marker
                          key={`cluster-${cluster.id}`}
                          latitude={latitude}
                          longitude={longitude}
                        >
                          <div
                            className="flex items-center justify-center rounded-full bg-blue-500 p-4"
                            style={{
                              width: `${
                                10 + (pointCount / points.length) * 20
                              }px`,
                              height: `${
                                10 + (pointCount / points.length) * 20
                              }px`,
                            }}
                            onClick={() =>
                              handleClusterClick(latitude, longitude)
                            }
                          >
                            {pointCount}
                          </div>
                        </Marker>
                      );
                    }

                    // we have a single point (crime) to render
                    return (
                      <Marker
                        key={`${cluster.properties.id}`}
                        latitude={latitude}
                        longitude={longitude}
                        onClick={() =>
                          handleMarkerClick(
                            cluster.properties.id,
                            latitude,
                            longitude
                          )
                        }
                      >
                        {/* <button className="crime-marker">
                          <img src="/custody.svg" alt="crime doesn't pay" />
                        </button> */}
                      </Marker>
                    );
                  })}
                  {/* <Source
                    id="clusters"
                    type="geojson"
                    data={{ type: "FeatureCollection", features: clusters }}
                  >
                    {/* @ts-ignore */}
                  {/* <Layer {...clusterLayer} />
                    <Layer {...clusterCountLayer} />
                  </Source>
                  <Source
                    type="geojson"
                    data={markerGeoJSOn as FeatureCollection}
                  > */}
                  {/* TODO: Replace circles with markers */}
                  {/* <Layer
                      id="marker-layer"
                      type="circle"
                      paint={{
                        "circle-color": "#FF0000",
                        "circle-radius": 5,
                      }}
                    /> */}
                  {/* @ts-ignore */}
                  {/* <Layer {...unclusteredPointLayer} />
                    <Layer
                      type="symbol"
                      layout={{
                        // "icon-image": "harbor-15",
                        // "icon-allow-overlap": true,
                        "text-field": ["get", "title"],
                        "text-font": [
                          "Open Sans Bold",
                          "Arial Unicode MS Bold",
                        ],
                        "text-size": 11,
                        "text-transform": "uppercase",
                        "text-letter-spacing": 0.05,
                        "text-offset": [0, 1.5],
                      }}
                    />
                  </Source> */}
                </Map>
              </MapProvider>
            </div>
          )}
        </div>
        // </div>
      )}
    </div>
  );
}
