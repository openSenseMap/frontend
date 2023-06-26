import { Outlet, useNavigate, useSearchParams } from "@remix-run/react";
import Map from "~/components/map";
import mapboxgl from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";

import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getDevices, getDevicesWithSensors } from "~/models/device.server";
import type {
  GeoJSONSource,
  LngLatLike,
  MapLayerMouseEvent,
  MapRef,
} from "react-map-gl";

import { MapProvider } from "react-map-gl";
import { Layer, Source } from "react-map-gl";
import { useState, useRef, useEffect } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { FeatureCollection, Point } from "geojson";
import {
  clusterCountLayer,
  clusterLayer,
  unclusteredPointLayer,
  phenomenonLayers,
  defaultLayer,
} from "~/components/map/layers";
import type { Device, Sensor } from "@prisma/client";
import OverlaySearch from "~/components/search/overlay-search";
import { Toaster } from "~/components/ui//toaster";
import { getUser } from "~/session.server";
import Legend from "~/components/map/legend";
import type { LegendValue, GradientColors } from "~/components/map/legend";
import { getPhenomena } from "~/models/phenomena.server";
import { getProfileByUserId } from "~/models/profile.server";

export async function loader({ request }: LoaderArgs) {
  // const devices = await getDevices();
  const devices = await getDevicesWithSensors();
  const user = await getUser(request);
  const phenomena = await getPhenomena();

  if (user) {
    const profile = await getProfileByUserId(user.id);
    return json({ devices, user, profile, phenomena });
  }
  return json({ devices, user, phenomena, profile: null });
}

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxgl,
    },
  ];
};

// THIS IS FOR TESTING, if you load the data in full_boxes.json, than this date will work
let currentDate = new Date("2023-06-21T14:13:11.024Z");
if (process.env.NODE_ENV === "production") {
  currentDate = new Date(Date.now() - 1000 * 600);
}

export default function Explore() {
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedPheno, setSelectedPheno] = useState<any | undefined>(
    undefined
  );

  const searchRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showClusters, setShowClusters] = useState(true);
  // const legendTitle = pathQuery[0] === "?phenomenon" ? pathQuery[1] : "";

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
  }, [searchParams]);

  const legendValues = (values: LegendValue[]) => {
    return values;
  };

  const gradientColors = (values: GradientColors) => {
    return values;
  };
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

  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const mapRef = useRef<MapRef>(null);

  const onMapClick = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];

      if (feature.layer.id === "osem-data") {
        const source = mapRef.current?.getSource("osem-data") as GeoJSONSource;
        source.getClusterExpansionZoom(
          feature.properties?.cluster_id,
          (err, zoom) => {
            if (err) {
              return;
            }

            mapRef.current?.easeTo({
              center: (feature.geometry as Point).coordinates as LngLatLike,
              zoom,
              duration: 500,
            });
          }
        );
      } else if (feature.layer.id === "unclustered-point") {
        navigate(`/explore/${feature.properties?.id}`);
      } else if (feature.layer.id === "base-layer") {
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

  const buildLayerFromPheno = (selectedPheno: any) => {
    //TODO: ADD VALUES TO DEFAULTLAYER FROM selectedPheno.ROV or min/max from values.
    return defaultLayer;
  };

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={data.devices} />
        {selectedPheno && (
          <Legend
            title={selectedPheno.label.item[0].text}
            values={legendValues([
              { value: 30, color: "fill-red-500", position: "right-[100%]" },
              { value: 20, color: "fill-yellow-500", position: "right-[75%]" },
              { value: 10, color: "fill-blue-100", position: "right-[50%]" },
              { value: 0, color: "fill-blue-700", position: "right-[25%]" },
              { value: -10, color: "fill-violet-500", position: "right-[0%]" },
            ])}
            firstGradient={gradientColors({
              from: "from-red-500",
              via: "via-orange-500",
              to: "to-yellow-500",
            })}
            secondGradient={gradientColors({
              from: "from-blue-100",
              via: "via-blue-700",
              to: "to-violet-500",
            })}
          />
        )}

        <Map
          ref={mapRef}
          initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
          interactiveLayerIds={
            selectedPheno ? ["base-layer"] : ["osem-data", "unclustered-point"]
          }
          onClick={onMapClick}
          onMouseMove={handleMouseMove}
        >
          {!selectedPheno && (
            <Source
              id="osem-data"
              type="geojson"
              data={data.devices as FeatureCollection<Point, Device>}
              cluster={showClusters}
            >
              <Layer {...clusterLayer} />
              <Layer {...clusterCountLayer} />
              <Layer {...unclusteredPointLayer} />
            </Source>
          )}
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
