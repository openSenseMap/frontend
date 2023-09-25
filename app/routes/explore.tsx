import {
  Outlet,
  useLoaderData,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";
import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { getDevices } from "~/models/device.server";
import type { MapRef } from "react-map-gl";
import { MapProvider } from "react-map-gl";
import { useRef } from "react";
import { getUser } from "~/session.server";
import type Supercluster from "supercluster";
import { getProfileByUserId } from "~/models/profile.server";
import ClusterLayer from "~/components/map/layers/cluster/cluster-layer";
import { typedjson } from "remix-typedjson";
import { Toaster } from "~/components/ui/toaster";
import { getFilteredDevices } from "~/utils";

export type DeviceClusterProperties =
  | Supercluster.PointFeature<any>
  | Supercluster.PointFeature<
      Supercluster.ClusterProperties & {
        categories: {
          [x: number]: number;
        };
      }
    >;

//*****************************************************
export async function loader({ request }: LoaderArgs) {
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

  //* fly to sensebox location when url inludes deviceId
  const { deviceId } = useParams();
  var deviceLoc: any;
  if (deviceId) {
    const device = data.devices.features.find(
      (device: any) => device.properties.id === deviceId
    );
    deviceLoc = [device?.properties.latitude, device?.properties.longitude];
  }

  return (
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
            devices={data.filteredDevices ? data.filteredDevices : data.devices}
          />
          <Toaster />
          <Outlet />
        </Map>
      </MapProvider>
    </div>
  );
}
