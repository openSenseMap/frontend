import { Outlet, useNavigate } from "@remix-run/react";
import Map from "~/components/map";
import mapboxgl from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";

import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getDevices } from "~/models/device.server";
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
} from "~/components/map/layers";
import type { Device } from "@prisma/client";
import OverlaySearch from "~/components/search/overlay-search";
import { Toaster } from "~/components/ui//toaster";
import { useToast } from "~/components/ui/use-toast";
import { getUser, getUserSession, sessionStorage } from "~/session.server";
import { getProfileByUserId } from "~/models/profile.server";

export async function loader({ request }: LoaderArgs) {
  const devices = await getDevices();

  const session = await getUserSession(request);
  const message = session.get("global_message") || null;

  const user = await getUser(request);
  if (user) {
    const profile = await getProfileByUserId(user.id);
    return json({ devices, user, profile });
  }

  return json(
    { devices, user, profile: null, message },
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
      href: mapboxgl,
    },
  ];
};

export default function Explore() {
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
        <Map
          ref={mapRef}
          initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
          interactiveLayerIds={["osem-data", "unclustered-point"]}
          onClick={onMapClick}
        >
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
