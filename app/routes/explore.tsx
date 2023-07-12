import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";

import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { getDevices } from "~/models/device.server";
import type { MapRef } from "react-map-gl";

import { MapProvider, Marker } from "react-map-gl";
import { useState, useRef, useMemo, useCallback } from "react";
import { useHotkeys } from "@mantine/hooks";
import OverlaySearch from "~/components/search/overlay-search";
import { Toaster } from "~/components/ui/toaster";
import { getUser } from "~/session.server";
import useSupercluster from "use-supercluster";
import DonutChartCluster from "~/components/map/layers/cluster/donut-chart-cluster";
import type { BBox, GeoJsonProperties } from "geojson";
import type Supercluster from "supercluster";
import type { PointFeature } from "supercluster";
import { Exposure, type Device } from "@prisma/client";
import { Box, Rocket } from "lucide-react";
import { getProfileByUserId } from "~/models/profile.server";
import ClusterLayer from "~/components/map/layers/cluster/cluster-layer";
import { typedjson } from "remix-typedjson";

export type DeviceClusterProperties =
  | Supercluster.PointFeature<any>
  | Supercluster.PointFeature<
      Supercluster.ClusterProperties & {
        categories: {
          [x: number]: number;
        };
      }
    >;

export async function loader({ request }: LoaderArgs) {
  const devices = await getDevices();
  const user = await getUser(request);

  if (user) {
    const profile = await getProfileByUserId(user.id);
    return typedjson({ devices, user, profile });
  }
  return typedjson({ devices, user, profile: null });
}

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxglcss,
    },
  ];
};

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

  const [showSearch, setShowSearch] = useState<boolean>(false);

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

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={data.devices} />
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
        >
          <ClusterLayer devices={data.devices} />
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
        </Map>
      </MapProvider>
    </div>
  );
}
