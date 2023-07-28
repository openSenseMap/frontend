import {
  Outlet,
  useLoaderData,
  useNavigate,
  useParams,
} from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";
import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { getDevices } from "~/models/device.server";
import type {
  GeoJSONSource,
  LngLatLike,
  MapLayerMouseEvent,
  MapRef,
} from "react-map-gl";
import { MapProvider } from "react-map-gl";
import { useState, useRef } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { FeatureCollection, Point } from "geojson";
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
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const mapRef = useRef<MapRef | null>(null);

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

  //* fly to sensebox location when url inludes deviceId
  const { deviceId } = useParams();
  var deviceLoc = [1.3, 2.3];
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
          <ClusterLayer devices={data.devices} />
          <Toaster />
          {showSearch ? (
            <OverlaySearch
              devices={data.devices}
              searchRef={searchRef}
              setShowSearch={setShowSearch}
            />
          ) : null}
          <Outlet />
        </Map>
      </MapProvider>
    </div>
  );
}
