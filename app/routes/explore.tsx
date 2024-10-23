/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLoaderData,
  useParams,
  redirect,
} from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css?url";
import Header from "~/components/header";
import type { LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { getDevices, getDevicesWithSensors } from "~/models/device.server";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl";
import { MapProvider, Layer, Source } from "react-map-gl";
import { useState, useRef, useEffect } from "react";
import { phenomenonLayers, defaultLayer } from "~/components/map/layers";
import Legend from "~/components/map/legend";
import type { LegendValue } from "~/components/map/legend";
import { getPhenomena } from "~/models/phenomena.server";
import type { FeatureCollection, Point } from "geojson";
import type Supercluster from "supercluster";
import { type Device, type Sensor } from "~/schema";
import { getUser, getUserSession } from "~/session.server";

import { getProfileByUserId } from "~/models/profile.server";
import ClusterLayer from "~/components/map/layers/cluster/cluster-layer";
import { typedjson } from "remix-typedjson";
import { getFilteredDevices } from "~/utils";
import ErrorMessage from "~/components/error-message";

export type DeviceClusterProperties =
  | Supercluster.PointFeature<any>
  | Supercluster.PointFeature<
      Supercluster.ClusterProperties & {
        categories: {
          [x: number]: number;
        };
      }
    >;

export async function loader({ request }: LoaderFunctionArgs) {
  //* Get filter params
  const url = new URL(request.url);
  const filterParams = url.search;
  const urlFilterParams = new URLSearchParams(url.search);

  // check if sensors are queried - if not get devices only to reduce load
  const devices = !urlFilterParams.get("phenomenon")
    ? await getDevices()
    : await getDevicesWithSensors();

  const session = await getUserSession(request);
  const message = session.get("global_message") || null;

  var filteredDevices = getFilteredDevices(devices, urlFilterParams);

  const user = await getUser(request);
  //const phenomena = await getPhenomena();

  if (user) {
    const profile = await getProfileByUserId(user.id);
    return typedjson({
      devices,
      user,
      profile,
      filteredDevices,
      //phenomena
    });
  }
  return typedjson({
    devices,
    user,
    profile: null,
    filterParams,
    filteredDevices,
    message,
    //phenomena,
  });
}

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxglcss,
    },
  ];
};

// This is for the live data display. The 21-06-2023 works with the seed Data, for Production take now minus 10 minutes
let currentDate = new Date("2023-06-21T14:13:11.024Z");
if (process.env.NODE_ENV === "production") {
  currentDate = new Date(Date.now() - 1000 * 600);
}

export default function Explore() {
  // data from our loader
  const data = useLoaderData<typeof loader>();

  const mapRef = useRef<MapRef | null>(null);

  // get map bounds
  const [, setViewState] = useState({
    longitude: 7.628202,
    latitude: 51.961563,
    zoom: 2,
  });
  const navigate = useNavigate();
  // const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedPheno, setSelectedPheno] = useState<any | undefined>(
    undefined,
  );
  const [searchParams] = useSearchParams();
  const [filteredData, setFilteredData] = useState<
    GeoJSON.FeatureCollection<Point, any>
  >({
    type: "FeatureCollection",
    features: [],
  });

  //listen to search params change
  // useEffect(() => {
  //   //filters devices for pheno
  //   if (searchParams.has("mapPheno") && searchParams.get("mapPheno") != "all") {
  //     let sensorsFiltered: any = [];
  //     let currentParam = searchParams.get("mapPheno");
  //     //check if pheno exists in sensor-wiki data
  //     let pheno = data.phenomena.filter(
  //       (pheno: any) => pheno.slug == currentParam?.toString(),
  //     );
  //     if (pheno[0]) {
  //       setSelectedPheno(pheno[0]);
  //       data.devices.features.forEach((device: any) => {
  //         device.properties.sensors.forEach((sensor: Sensor) => {
  //           if (
  //             sensor.sensorWikiPhenomenon == currentParam &&
  //             sensor.lastMeasurement
  //           ) {
  //             const lastMeasurementDate = new Date(
  //               //@ts-ignore
  //               sensor.lastMeasurement.createdAt,
  //             );
  //             //take only measurements in the last 10mins
  //             //@ts-ignore
  //             if (currentDate < lastMeasurementDate) {
  //               sensorsFiltered.push({
  //                 ...device,
  //                 properties: {
  //                   ...device.properties,
  //                   sensor: {
  //                     ...sensor,
  //                     lastMeasurement: {
  //                       //@ts-ignore
  //                       value: parseFloat(sensor.lastMeasurement.value),
  //                       //@ts-ignore
  //                       createdAt: sensor.lastMeasurement.createdAt,
  //                     },
  //                   },
  //                 },
  //               });
  //             }
  //           }
  //         });
  //         return false;
  //       });
  //       setFilteredData({
  //         type: "FeatureCollection",
  //         features: sensorsFiltered,
  //       });
  //     }
  //   } else {
  //     setSelectedPheno(undefined);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchParams]);

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
      (v: number | string) => typeof v === "number",
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

  // // /**
  // //  * Focus the search input when the search overlay is displayed
  // //  */
  // // const focusSearchInput = () => {
  // //   searchRef.current?.focus();
  // // };

  // /**
  //  * Display the search overlay when the ctrl + k key combination is pressed
  //  */
  // useHotkeys([
  //   [
  //     "ctrl+K",
  //     () => {
  //       setShowSearch(!showSearch);
  //       setTimeout(() => {
  //         focusSearchInput();
  //       }, 100);
  //     },
  //   ],
  // ]);

  const onMapClick = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];

      if (feature.layer.id === "phenomenon-layer") {
        navigate(
          `/explore/${feature.properties?.id}?${searchParams.toString()}`,
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

  //* fly to sensebox location when url inludes deviceId
  const { deviceId } = useParams();
  var deviceLoc: any;
  if (deviceId) {
    const device = data.devices.features.find(
      (device: any) => device.properties.id === deviceId,
    );
    deviceLoc = [device?.properties.latitude, device?.properties.longitude];
  }

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
            values={legendLabels()}
          />
        )}
        <Map
          onMove={(evt) => setViewState(evt.viewState)}
          interactiveLayerIds={selectedPheno ? ["phenomenon-layer"] : []}
          onClick={onMapClick}
          onMouseMove={handleMouseMove}
          ref={mapRef}
          initialViewState={
            deviceId
              ? { latitude: deviceLoc[0], longitude: deviceLoc[1], zoom: 10 }
              : { latitude: 7, longitude: 52, zoom: 2 }
          }
        >
          {!selectedPheno && <ClusterLayer devices={data.filteredDevices} />}
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

          {/* <ClusterLayer
              devices={filterOptionsOn ? GlobalFilteredDevices : data.devices}
            /> */}
          <Outlet />
        </Map>
      </MapProvider>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
