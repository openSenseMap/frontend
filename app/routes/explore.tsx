import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLoaderData,
} from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";
import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getDevicesWithSensors } from "~/models/device.server";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl";
import { MapProvider, Marker, Layer, Source } from "react-map-gl";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useHotkeys } from "@mantine/hooks";
import { phenomenonLayers, defaultLayer } from "~/components/map/layers";
import OverlaySearch from "~/components/search/overlay-search";
import Legend from "~/components/map/legend";
import type { LegendValue } from "~/components/map/legend";
import { getPhenomena } from "~/models/phenomena.server";
import useSupercluster from "use-supercluster";
import DonutChartCluster from "~/components/map/cluster/donut-chart-cluster";
import type {
  BBox,
  GeoJsonProperties,
  FeatureCollection,
  Point,
} from "geojson";
import type Supercluster from "supercluster";
import type { PointFeature } from "supercluster";
import { Exposure, type Device, type Sensor } from "@prisma/client";
import { Box, Rocket } from "lucide-react";
import { Toaster } from "~/components/ui//toaster";
import { getUser, getUserSession, sessionStorage } from "~/session.server";
import { useToast } from "~/components/ui/use-toast";
import { getProfileByUserId } from "~/models/profile.server";

export type DeviceClusterProperties =
  | Supercluster.PointFeature<any>
  | Supercluster.PointFeature<
      Supercluster.ClusterProperties & {
        categories: {
          [x: number]: number;
        };
      }
    >;

// supercluster options
const options = {
  radius: 50,
  maxZoom: 14,
  map: (props: any) => ({ categories: { [props.status]: 1 } }),
  reduce: (accumulated: any, props: any) => {
    const categories: any = {};
    // clone the categories object from the accumulator
    for (const key in accumulated.categories) {
      categories[key] = accumulated.categories[key];
    }
    // add props' category data to the clone
    for (const key in props.categories) {
      if (key in accumulated.categories) {
        categories[key] = accumulated.categories[key] + props.categories[key];
      } else {
        categories[key] = props.categories[key];
      }
    }
    // assign the clone to the accumulator
    accumulated.categories = categories;
  },
};

export async function loader({ request }: LoaderArgs) {
  const devices = await getDevicesWithSensors();

  const session = await getUserSession(request);
  const message = session.get("global_message") || null;

  const user = await getUser(request);
  const phenomena = await getPhenomena();

  if (user) {
    const profile = await getProfileByUserId(user.id);
    return json(
      { devices, user, profile, message, phenomena },
      {
        headers: {
          // only necessary with cookieSessionStorage
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      }
    );
  }
  return json(
    { devices, user, profile: null, message, phenomena },
    {
      headers: {
        // only necessary with cookieSessionStorage
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    }
  );
}

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxglcss,
    },
  ];
};

// The 21-06-2023 works with the seed Data, for Production take now minus 10 minutes
let currentDate = new Date("2023-06-21T14:13:11.024Z");
if (process.env.NODE_ENV === "production") {
  currentDate = new Date(Date.now() - 1000 * 600);
}

export default function Explore() {
  // data from our loader
  const data = useLoaderData<typeof loader>();

  const mapRef = useRef<MapRef | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // get map bounds
  const [viewState, setViewState] = useState({
    longitude: 52,
    latitude: 7,
    zoom: 2,
  });
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedPheno, setSelectedPheno] = useState<any | undefined>(
    undefined
  );
  const [searchParams] = useSearchParams();
  const [filteredData, setFilteredData] = useState<
    GeoJSON.FeatureCollection<Point, any>
  >({
    type: "FeatureCollection",
    features: [],
  });

  //listen to search params change
  useEffect(() => {
    //filters devices for pheno
    if (searchParams.has("phenomenon")) {
      let sensorsFiltered: any = [];
      let currentParam = searchParams.get("phenomenon");

      //check if pheno exists in sensor-wiki data
      let pheno = data.phenomena.filter(
        (pheno: any) => pheno.slug == currentParam?.toString()
      );
      if (pheno[0]) {
        setSelectedPheno(pheno[0]);
        data.devices.features.forEach((device: any) => {
          device.properties.sensors.forEach((sensor: Sensor) => {
            if (
              sensor.sensorWikiPhenomenon == currentParam &&
              sensor.lastMeasurement
            ) {
              const lastMeasurementDate = new Date(
                //@ts-ignore
                sensor.lastMeasurement.createdAt
              );
              //take only measurements in the last 10mins
              //@ts-ignore
              if (currentDate < lastMeasurementDate) {
                sensorsFiltered.push({
                  ...device,
                  properties: {
                    ...device.properties,
                    sensor: {
                      ...sensor,
                      lastMeasurement: {
                        //@ts-ignore
                        value: parseFloat(sensor.lastMeasurement.value),
                        //@ts-ignore
                        createdAt: sensor.lastMeasurement.createdAt,
                      },
                    },
                  },
                });
              }
            }
          });
          return false;
        });
        setFilteredData({
          type: "FeatureCollection",
          features: sensorsFiltered,
        });
      }
    } else {
      setSelectedPheno(undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function calculateLabelPositions(length: number): string[] {
    const positions: string[] = [];
    for (let i = length - 1; i >= 0; i--) {
      const position =
        i === length - 1 ? "95%" : `${((i / (length - 1)) * 100).toFixed(0)}%`;
      positions.push(position);
    }
    return positions;
  }

  const legendLabels = () => {
    const values =
      //@ts-ignore
      phenomenonLayers[selectedPheno.slug].paint["circle-color"].slice(3);
    const numbers = values.filter(
      (v: number | string) => typeof v === "number"
    );
    const colors = values.filter((v: number | string) => typeof v === "string");
    const positions = calculateLabelPositions(numbers.length);

    const legend: LegendValue[] = [];
    const length = numbers.length;
    for (let i = 0; i < length; i++) {
      const legendObj: LegendValue = {
        value: numbers[i],
        color: colors[i],
        position: positions[i],
      };
      legend.push(legendObj);
    }
    return legend;
  };
  const { toast } = useToast();

  /**
   * Focus the search input when the search overlay is displayed
   */
  const focusSearchInput = () => {
    searchRef.current?.focus();
  };

  /**
   * Display the search overlay when the ctrl + k key combination is pressed
   */
  useHotkeys([
    [
      "ctrl+K",
      () => {
        setShowSearch(!showSearch);
        setTimeout(() => {
          focusSearchInput();
        }, 100);
      },
    ],
  ]);

  // get clusters
  const points: PointFeature<GeoJsonProperties & Device>[] = useMemo(() => {
    return data.devices.features.map((device) => ({
      type: "Feature",
      properties: {
        cluster: false,
        ...device.properties,
      },
      geometry: device.geometry,
    }));
  }, [data.devices.features]);

  const bounds = mapRef.current
    ? (mapRef.current.getMap().getBounds().toArray().flat() as BBox)
    : ([-92, -72, 193, 76] as BBox);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options,
  });

  const clusterOnClick = useCallback(
    (cluster: DeviceClusterProperties) => {
      // supercluster from hook can be null or undefined
      if (!supercluster) return;

      const [longitude, latitude] = cluster.geometry.coordinates;

      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(cluster.id as number),
        20
      );

      mapRef.current?.getMap().flyTo({
        center: [longitude, latitude],
        animate: true,
        speed: 1.6,
        zoom: expansionZoom,
        essential: true,
      });
    },
    [supercluster]
  );

  const onMapClick = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];

      if (feature.layer.id === "phenomenon-layer") {
        navigate(
          `/explore/${feature.properties?.id}?${searchParams.toString()}`
        );
      }
    }
  };

  const handleMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      mapRef!.current!.getCanvas().style.cursor = "pointer";
    } else {
      mapRef!.current!.getCanvas().style.cursor = "";
    }
  };

  const clusterMarker = useMemo(() => {
    return clusters.map((cluster) => {
      // every cluster point has coordinates
      const [longitude, latitude] = cluster.geometry.coordinates;
      // the point may be either a cluster or a crime point
      const { cluster: isCluster } = cluster.properties;

      // we have a cluster to render
      if (isCluster) {
        return (
          <Marker
            key={`cluster-${cluster.id}`}
            latitude={latitude}
            longitude={longitude}
          >
            <DonutChartCluster
              cluster={cluster}
              clusterOnClick={clusterOnClick}
            />
          </Marker>
        );
      }

      // we have a single device to render
      return (
        <Marker
          key={`device-${(cluster.properties as Device).id}`}
          latitude={latitude}
          longitude={longitude}
        >
          <div
            style={{ position: "absolute", left: 0 - 10, top: 0 - 10 }}
            className="flex w-fit cursor-pointer items-center rounded-full bg-white p-1 text-sm shadow hover:z-10 hover:shadow-lg"
            onClick={() => navigate(`${(cluster.properties as Device).id}`)}
          >
            <span className="rounded-full">
              {(cluster.properties as Device).exposure === Exposure.MOBILE ? (
                <Rocket className="h-4 w-4" />
              ) : (
                <Box className="h-4 w-4" />
              )}
            </span>
          </div>
        </Marker>
      );
    });
  }, [clusterOnClick, clusters, navigate]);

  const buildLayerFromPheno = (selectedPheno: any) => {
    //TODO: ADD VALUES TO DEFAULTLAYER FROM selectedPheno.ROV or min/max from values.
    return defaultLayer;
  };
  useEffect(() => {
    if (data.message !== null) {
      toast({
        description: data.message,
      });
    }
  }, [data.message, toast]);

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={data.devices} />
        {selectedPheno && (
          <Legend
            title={selectedPheno.label.item[0].text}
            values={legendLabels()}
          />
        )}
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          interactiveLayerIds={selectedPheno ? ["phenomenon-layer"] : []}
          onClick={onMapClick}
          onMouseMove={handleMouseMove}
        >
          {/* if a Phenomonen is selected show the Layers with live data, otherwise the clusters */}
          {!selectedPheno && clusterMarker}
          {selectedPheno && (
            <Source
              id="osem-data"
              type="geojson"
              data={filteredData as FeatureCollection<Point, Device>}
              cluster={false}
            >
              <Layer
                {...(phenomenonLayers[selectedPheno.slug] ??
                  buildLayerFromPheno(selectedPheno))}
              />
            </Source>
          )}
        </Map>
        <Toaster />
        {showSearch ? (
          <OverlaySearch
            devices={data.devices}
            searchRef={searchRef}
            setShowSearch={setShowSearch}
          />
        ) : null}
        <main className="absolute bottom-0 z-10 w-full">
          <Outlet />
        </main>
      </MapProvider>
    </div>
  );
}
