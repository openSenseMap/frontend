import { Outlet, useNavigate } from "@remix-run/react";
import Map from "~/components/Map";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import Header from "~/components/header/Header";

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
import { Layer, Source } from "react-map-gl";
import { useRef } from "react";
import type { FeatureCollection, Point } from "geojson";
import {
  clusterCountLayer,
  clusterLayer,
  unclusteredPointLayer,
} from "~/components/Map/Layers";
import type { Device } from "@prisma/client";

export async function loader({ request }: LoaderArgs) {
  const devices = await getDevices();
  return json({ devices });
}

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
  ];
};

export default function Explore() {
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
      <Header />
      <Map
        ref={mapRef}
        initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
        interactiveLayerIds={["osem-data", "unclustered-point"]}
        onClick={onMapClick}
        hash={true}
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
      <main className="absolute bottom-0 z-10 w-full">
        <Outlet />
      </main>
    </div>
  );
}
