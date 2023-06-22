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
  tempLayer,
} from "~/components/map/layers";
import type { Device, Sensor } from "@prisma/client";
import OverlaySearch from "~/components/search/overlay-search";
import { Toaster } from "~/components/ui//toaster";
import { getUser } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  // const devices = await getDevices();
  const devices = await getDevicesWithSensors();
  const user = await getUser(request);
  return json({ devices, user });
}

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxgl,
    },
  ];
};

// THIS IS FOR TESTING, CHANGE TO LIVE DATE minus 10 minutes FOR PRODUCTION LATER
const currentDate = new Date("2023-06-21T14:13:11.024Z");

export default function Explore() {
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedPheno, setSelectedPheno] = useState<string | undefined>(
    undefined
  );

  const searchRef = useRef<HTMLInputElement>(null);
  let [searchParams, setSearchParams] = useSearchParams();

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
      setSelectedPheno(searchParams.get("phenomenon")?.toString());
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
      console.log("FILTERED", sensorsFiltered);
      setFilteredData({
        type: "FeatureCollection",
        features: sensorsFiltered,
      });
    }
    // if (searchParams.has("phenomenon")) {
    //   console.log(searchParams.get("phenomenon"));
    //   const fetchData = async () => {
    //     const data = await getSensors();
    //     return data;
    //   };
    //   const result = fetchData()
    //     // make sure to catch any error
    //     .catch(console.error);
    //   console.log(result);
  }, [searchParams]);

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
      }
    }
  };

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={data.devices} />
        <Map
          ref={mapRef}
          initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
          interactiveLayerIds={["osem-data", "unclustered-point"]}
          onClick={onMapClick}
        >
          {!selectedPheno && (
            <Source
              id="osem-data"
              type="geojson"
              data={data.devices as FeatureCollection<Point, Device>}
              cluster={true}
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
              <Layer {...tempLayer} />
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
