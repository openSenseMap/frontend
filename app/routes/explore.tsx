import { Outlet, useLocation, useNavigate } from "@remix-run/react";
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
import { useState, useRef } from "react";
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
import { getUser } from "~/session.server";
import Legend from "~/components/map/legend";
import type { LegendValue } from "~/components/map/legend";
import { getPhenomena } from "~/models/phenomena.server";
import { getProfileByUserId } from "~/models/profile.server";

export async function loader({ request }: LoaderArgs) {
  const devices = await getDevices();
  const user = await getUser(request);
  const phenomena = await getPhenomena();

  if (user) {
    const profile = await getProfileByUserId(user.id);
    return json({ devices, user, profile });
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

export default function Explore() {
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [showClusters, setShowClusters] = useState(true);
  const pathQuery = useLocation().search.split("=");
  const legendTitle = pathQuery[0] === "?phenomenon" ? pathQuery[1] : "";

  const legendValues = (values: LegendValue[]) => {
    return values;
  };

  //TODO: Range für array festlegen
  const legendColors = (values: string[]) => {
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
      }
    }
  };

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={data.devices} />
        <Legend
          title={legendTitle}
          values={legendValues([
            { value: 30, color: "red-500", position: "left-[5%]" },
            { value: 20, color: "yellow-500", position: "left-[20%]" },
            { value: 10, color: "blue-100", position: "left-[50%]" },
            { value: 0, color: "blue-700", position: "right-[25%]" },
            { value: -5, color: "violet-500", position: "right-[10%]" },
          ])}
          colors={legendColors([
            "red-500",
            "orange-500",
            "yellow-500",
            "green-100",
            "blue-700",
            "violet-500",
          ])} // MUST BE LENGTH 6 AS OF NOW
        />
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
            cluster={showClusters} // TODO: allow user to toggle cluster view
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
