import { Outlet, useLoaderData } from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";
import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { getDevices } from "~/models/device.server";
import type { MapRef } from "react-map-gl";
import { MapProvider } from "react-map-gl";
import { useState, useRef } from "react";
import { useHotkeys } from "@mantine/hooks";
import OverlaySearch from "~/components/search/overlay-search";
import { getUser } from "~/session.server";
import type Supercluster from "supercluster";
import { getProfileByUserId } from "~/models/profile.server";
import ClusterLayer from "~/components/map/layers/cluster/cluster-layer";
import { typedjson } from "remix-typedjson";
import { Toaster } from "~/components/ui/toaster";

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
        <Map ref={mapRef}>
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
