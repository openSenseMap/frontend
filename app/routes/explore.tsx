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
  MapSourceDataEvent,
  MapStyleDataEvent,
  MapboxEvent,
} from "react-map-gl";

import { MapProvider } from "react-map-gl";
import { Layer, Source } from "react-map-gl";
import { useState, useRef, useCallback } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { FeatureCollection, GeoJsonProperties, Point } from "geojson";
import {
  clusterCountLayer,
  clusterLayer,
  deviceStatusFilter,
  unclusteredPointLayer,
} from "~/components/Map/Layers";
import type { Device } from "@prisma/client";
import OverlaySearch from "~/components/search/OverlaySearch";
import mapboxgl from "mapbox-gl";
import createDonutChart from "~/components/Map/cluster";

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
  const navigate = useNavigate();

  // objects for caching and keeping track of HTML marker objects (for performance)
  const markers = {};
  let markersOnScreen = {};

  function updateMarkers() {
    const newMarkers = {};
    const features = mapRef.current?.getMap().querySourceFeatures("devices");

    if (!features) return;

    // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
    // and add it to the map if it's not there already
    for (const feature of features) {
      const coords = feature.geometry.coordinates;
      const props: GeoJsonProperties = feature.properties;
      if (!props) return;

      if (!props.cluster) continue;
      const id = props.cluster_id;

      let marker = markers[id];
      if (!marker) {
        const el = createDonutChart(props);
        marker = markers[id] = new mapboxgl.Marker({
          element: el,
        }).setLngLat(coords);
      }
      newMarkers[id] = marker;

      if (!markersOnScreen[id]) marker.addTo(mapRef.current?.getMap());
    }
    // for every marker we've added previously, remove those that are no longer visible
    for (const id in markersOnScreen) {
      if (!newMarkers[id]) markersOnScreen[id].remove();
    }
    markersOnScreen = newMarkers;
  }

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

  const onMapClick = (e: MapLayerMouseEvent) => {
    console.log("map click", e.features);
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];

      if (feature.layer.id === "osem-data") {
        const source = mapRef.current?.getSource("devices") as GeoJSONSource;
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

  // Used render event like in official example
  // https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/
  const onRender = (event: MapboxEvent) => {
    // Return if source is not available
    if (!mapRef.current?.getMap().getSource("devices")) return;

    // Return if source is not loaded
    if (!mapRef.current?.getMap().isSourceLoaded("devices")) return;

    // Update markers if source is available and create donut chart clusters
    updateMarkers();
  };

  // Not sure if one of these events are better suited for drawing the clusters
  const onData = (event: MapStyleDataEvent | MapSourceDataEvent) => {
    // console.log("onData", event);
  };
  const onSourceData = (event: MapSourceDataEvent) => {
    // console.log("onSourceData", event);
  };
  const onLoad = (event: MapboxEvent) => {
    // console.log("onLoad", event);
  };

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={data.devices} />
        <Map
          ref={mapRefCallback}
          initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
          interactiveLayerIds={["unclustered-point"]}
          onClick={onMapClick}
          onData={onData}
          onSourceData={onSourceData}
          onLoad={onLoad}
          onRender={onRender}
        >
          <Source
            id="devices"
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
            {/* <Layer {...clusterLayer} /> */}
            {/* <Layer {...clusterCountLayer} /> */}
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
