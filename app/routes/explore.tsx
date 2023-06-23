import { Outlet, useNavigate } from "@remix-run/react";
import Map from "~/components/map";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css";
import Header from "~/components/header";

import type { LoaderArgs, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getDevices } from "~/models/device.server";
import type { MapRef } from "react-map-gl";

import { MapProvider, Marker } from "react-map-gl";
import { useState, useRef, useMemo } from "react";
import { useHotkeys } from "@mantine/hooks";
import OverlaySearch from "~/components/search/overlay-search";
import { Toaster } from "~/components/ui/toaster";
import { getUser } from "~/session.server";
import useSupercluster from "use-supercluster";
import DonutChartCluster from "~/components/map/cluster/donut-chart-cluster";

const options = {
  radius: 50,
  maxZoom: 14,
  map: (props) => ({
    active: 0,
    inactive: 0,
    old: 0,
    status: props.status,
  }),
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
  // data from our loader
  const data = useLoaderData<typeof loader>();

  const mapRef = useRef<MapRef | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // get map bounds
  const [viewState, setViewState] = useState({
    longitude: 52,
    latitude: 7,
    zoom: 2,
  });

  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState<boolean>(false);

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
  }, [data.devices.features]);

  const bounds = mapRef.current
    ? mapRef.current.getMap().getBounds().toArray().flat()
    : undefined;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options,
  });
  // console.log(clusters);

  const clusterOnClick = (cluster) => {
    const [longitude, latitude] = cluster.geometry.coordinates;
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
  };

  const clusterMarker = useMemo(() => {
    return clusters.map((cluster) => {
      // every cluster point has coordinates
      const [longitude, latitude] = cluster.geometry.coordinates;
      // the point may be either a cluster or a crime point
      const { cluster: isCluster } = cluster.properties;

      // we have a cluster to render
      if (isCluster) {
        return (
          <Marker
            key={`cluster-${cluster.id}`}
            latitude={latitude}
            longitude={longitude}
          >
            <DonutChartCluster
              cluster={cluster}
              clusterOnClick={clusterOnClick}
            />
          </Marker>
        );
      }

      // we have a single device to render
      return (
        <Marker
          key={`device-${cluster.properties.id}`}
          latitude={latitude}
          longitude={longitude}
        >
          <div
            style={{ position: "absolute", left: 0 - 10, top: 0 - 10 }}
            className="flex w-fit cursor-pointer items-center rounded-full bg-white pl-1 pr-2 text-sm shadow hover:z-10 hover:shadow-lg"
          >
            {cluster.properties.name}
          </div>
        </Marker>
      );
    });
  }, [clusters]);

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={data.devices} />
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
        >
          {clusterMarker}
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
