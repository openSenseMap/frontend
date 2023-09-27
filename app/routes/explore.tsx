import { Outlet, useLoaderData, useParams } from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";
import type { LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { getDevices } from "~/models/device.server";
import type { MapRef } from "react-map-gl";
import { MapProvider } from "react-map-gl";
import { useRef, createContext, useState } from "react";
import { getUser } from "~/session.server";
import type Supercluster from "supercluster";
import { getProfileByUserId } from "~/models/profile.server";
import ClusterLayer from "~/components/map/layers/cluster/cluster-layer";
import { typedjson } from "remix-typedjson";
import { Toaster } from "~/components/ui/toaster";
import { getFilteredDevices } from "~/utils";
import ErrorMessage from "~/components/error-message";

//* Used in filter-options component
export const FilterOptionsContext = createContext({
  // globalFilterParams: new URLSearchParams(""),
  filterOptionsOn: false,
  setFilterOptionsOn: (_filterOptionsOn: boolean) => {},
  // setGlobalFilterParams: (_urlFilter: URLSearchParams) => {},
  GlobalFilteredDevices: {},
  setGlobalFilteredDevices: (_GlobalFilteredDevices: {}) => {},
});

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
  const devices = await getDevices();

  //* Get filtered devices if filter params exist in url
  const url = new URL(request.url);
  const filterParams = url.search;
  const urlFilterParams = new URLSearchParams(url.search);
  var filteredDevices = null;
  if (
    urlFilterParams.has("exposure") ||
    urlFilterParams.has("status") ||
    urlFilterParams.has("phenomenon")
  ) {
    filteredDevices = getFilteredDevices(devices, urlFilterParams);
  }

  const user = await getUser(request);

  if (user) {
    const profile = await getProfileByUserId(user.id);
    return typedjson({ devices, user, profile, filteredDevices });
  }
  return typedjson({
    devices,
    user,
    profile: null,
    filterParams,
    filteredDevices,
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

//*********************************
export default function Explore() {
  // data from our loader
  const data = useLoaderData<typeof loader>();

  const mapRef = useRef<MapRef | null>(null);

  //* initialize filtered devices if any
  const [GlobalFilteredDevices, setGlobalFilteredDevices] = useState(
    data.filteredDevices ? data.filteredDevices : {},
  );
  const [filterOptionsOn, setFilterOptionsOn] = useState(
    data.filteredDevices ? true : false,
  );

  //* fly to sensebox location when url inludes deviceId
  const { deviceId } = useParams();
  var deviceLoc: any;
  if (deviceId) {
    const device = data.devices.features.find(
      (device: any) => device.properties.id === deviceId,
    );
    deviceLoc = [device?.properties.latitude, device?.properties.longitude];
  }

  return (
    <FilterOptionsContext.Provider
      value={{
        filterOptionsOn,
        setFilterOptionsOn,
        GlobalFilteredDevices,
        setGlobalFilteredDevices,
      }}
    >
      <div className="h-full w-full">
        <MapProvider>
          <Header devices={data.devices} />
          <Map
            ref={mapRef}
            initialViewState={
              deviceId
                ? { latitude: deviceLoc[0], longitude: deviceLoc[1], zoom: 10 }
                : { latitude: 7, longitude: 52, zoom: 2 }
            }
          >
            <ClusterLayer
              devices={filterOptionsOn ? GlobalFilteredDevices : data.devices}
            />
            <Toaster />
            <Outlet />
          </Map>
        </MapProvider>
      </div>
    </FilterOptionsContext.Provider>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
