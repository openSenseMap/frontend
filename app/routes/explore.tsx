import { Outlet, useNavigate } from "@remix-run/react";
import Map from "~/components/Map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
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

import { MapProvider } from "react-map-gl";
import { Layer, Source } from "react-map-gl";
import { useState, useRef, useCallback } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { FeatureCollection, Point } from "geojson";
import {
  clusterCountLayer,
  clusterLayer,
  deviceStatusFilter,
  unclusteredPointLayer,
} from "~/components/Map/Layers";
import type { Device } from "@prisma/client";
import OverlaySearch from "~/components/search/OverlaySearch";

export async function loader({ request }: LoaderArgs) {
  const devices = await getDevices();
  return json({ devices });
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
  console.log("Explore - data: ", data);
  const navigate = useNavigate();

  const mapRef = useRef<MapRef | null>(null);
  const mapRefCallback = useCallback((ref: MapRef | null) => {
    if (ref !== null) {
      //Set the actual ref we use elsewhere
      mapRef.current = ref;
      const map = ref;

      const loadImage = () => {
        if (!map.hasImage("cat")) {
          //NOTE ref for adding local image instead
          map.loadImage("/custom_marker.png", (error, image) => {
            if (error || image === undefined) throw error;
            map.addImage("cat", image);
          });
        }
      };

      loadImage();
    }
  }, []);

  // const symbolLayer = {
  //   id: "earthquake_label",
  //   type: "symbol",
  //   source: "osem-data",
  //   filter: ["!=", "cluster", true],
  //   layout: {
  //     "text-field": [
  //       "number-format",
  //       ["get", "mag"],
  //       { "min-fraction-digits": 1, "max-fraction-digits": 1 },
  //     ],
  //     "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
  //     "text-size": 10,
  //   },
  //   paint: {
  //     "text-color": ["case", ["<", ["get", "mag"], 3], "black", "white"],
  //   },
  // };

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
        <Map
          ref={mapRefCallback}
          initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
          interactiveLayerIds={["osem-data", "unclustered-point"]}
          onClick={onMapClick}
        >
          <Source
            id="osem-data"
            type="geojson"
            data={data.devices as FeatureCollection<Point, Device>}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
            clusterProperties={
              // keep separate counts for each status category in a cluster
              {
                active: ["+", ["case", deviceStatusFilter.active, 1, 0]],
                inactive: ["+", ["case", deviceStatusFilter.inactive, 1, 0]],
                old: ["+", ["case", deviceStatusFilter.old, 1, 0]],
              }
            }
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>
        </Map>
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
