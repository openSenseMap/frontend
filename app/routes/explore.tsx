import { Outlet, useNavigate } from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
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
  MapSourceDataEvent,
  MapStyleDataEvent,
  MapboxEvent,
} from "react-map-gl";

import { MapProvider, Marker } from "react-map-gl";
import { useState, useRef, useCallback, useMemo } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { Point } from "geojson";
import OverlaySearch from "~/components/search/overlay-search";
import { Toaster } from "~/components/ui/toaster";
import { getUser } from "~/session.server";
import useSupercluster from "use-supercluster";

const options = {
  radius: 50,
  maxZoom: 14,
  map: (props) => ({ active: 0, inactive: 0, old: 0, status: props.status }),
  reduce: (accumulated, props) => {
    if (props.status === "ACTIVE") {
      accumulated.active += 1;
    } else if (props.status === "INACTIVE") {
      accumulated.inactive += 1;
    } else if (props.status === "OLD") {
      accumulated.old += 1;
    }
  },
};

export async function loader({ request }: LoaderArgs) {
  const devices = await getDevices();
  const user = await getUser(request);

  return json({ devices, user });
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

  const mapRef = useRef<MapRef | null>(null);
  // const mapRefCallback = useCallback((ref: MapRef | null) => {
  //   if (ref !== null) {
  //     //Set the actual ref we use elsewhere
  //     mapRef.current = ref;
  //     const map = ref;

  //     const loadImage = () => {
  //       if (!map.hasImage("device")) {
  //         //NOTE ref for adding local image instead
  //         map.loadImage("/box.png", (error, image) => {
  //           if (error || image === undefined) throw error;
  //           map.addImage("box", image, { sdf: true });
  //         });
  //       }

  //       if (!map.hasImage("mobile")) {
  //         //NOTE ref for adding local image instead
  //         map.loadImage("/mobile.png", (error, image) => {
  //           if (error || image === undefined) throw error;
  //           map.addImage("mobile", image, { sdf: true });
  //         });
  //       }
  //     };

  //     loadImage();
  //   }
  // }, []);

  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // get map bounds
  const [viewState, setViewState] = useState({
    longitude: 52,
    latitude: 7,
    zoom: 2,
  });

  // get clusters
  const points = useMemo(() => {
    return data.devices.features.map((device) => ({
      type: "Feature",
      properties: {
        cluster: false,
        ...device.properties,
      },
      geometry: device.geometry,
    }));
  }, []);

  const bounds = mapRef.current
    ? mapRef.current.getMap().getBounds().toArray().flat()
    : undefined;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options,
  });
  console.log(clusters);

  const onMapClick = (e: MapLayerMouseEvent) => {
    console.log("map click", e);
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];

      if (feature.layer.id === "cluster") {
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
    // updateMarkers();
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
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          interactiveLayerIds={["cluster", "unclustered-point"]}
          onClick={onMapClick}
          onData={onData}
          onSourceData={onSourceData}
          onLoad={onLoad}
          onRender={onRender}
        >
          {clusters.map((cluster) => {
            // every cluster point has coordinates
            const [longitude, latitude] = cluster.geometry.coordinates;
            // the point may be either a cluster or a crime point
            const { cluster: isCluster, point_count: pointCount } =
              cluster.properties;

            // we have a cluster to render
            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  latitude={latitude}
                  longitude={longitude}
                >
                  <div
                    className="flex items-center justify-center rounded-[50%] bg-blue-500 p-3 text-white"
                    style={{
                      width: `50px`,
                      height: `50px`,
                    }}
                    onClick={() => {
                      const expansionZoom = Math.min(
                        supercluster.getClusterExpansionZoom(cluster.id),
                        20
                      );

                      mapRef.current?.getMap().flyTo({
                        center: [longitude, latitude],
                        animate: true,
                        speed: 1.6,
                        zoom: expansionZoom,
                        essential: true,
                      });
                    }}
                  >
                    {pointCount}
                  </div>
                </Marker>
              );
            }

            // we have a single point (crime) to render
            return (
              <Marker
                key={`device-${cluster.properties.id}`}
                latitude={latitude}
                longitude={longitude}
              >
                <div>{cluster.properties.name}</div>
              </Marker>
            );
          })}
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
