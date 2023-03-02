import { Outlet } from "@remix-run/react";
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
import type { Point } from "geojson";

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

const clusterLayer = {
  id: "osem-data",
  type: "circle",
  source: "osem-data",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#5394d0",
    "circle-radius": 20,
  },
};

const clusterCountLayer = {
  id: "cluster-count",
  type: "symbol",
  source: "osem-data",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-size": 12,
  },
};

export default function Explore() {
  const data = useLoaderData<typeof loader>();

  const mapRef = useRef<MapRef>(null);

  const onMapClick = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];

      if (feature.layer.id === "osem-data") {
        const source = mapRef.current.getSource("osem-data") as GeoJSONSource;
        source.getClusterExpansionZoom(
          feature.properties.cluster_id,
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
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Header />
      <Map
        ref={mapRef}
        initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
        interactiveLayerIds={[clusterLayer.id]}
        onClick={onMapClick}
      >
        <Source
          id="osem-data"
          type="geojson"
          data={data.devices}
          cluster={true}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
        </Source>
      </Map>
      <main className="absolute bottom-0 z-10 w-full">
        <Outlet />
      </main>
    </div>
  );
}
