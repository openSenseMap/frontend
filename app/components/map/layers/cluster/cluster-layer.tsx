import type { Device } from "@prisma/client";
import { Exposure } from "@prisma/client";
import type {
  GeoJsonProperties,
  BBox,
  FeatureCollection,
  Point,
} from "geojson";
import { useMemo, useCallback } from "react";
import { Marker, useMap } from "react-map-gl";
import type { PointFeature } from "supercluster";
import useSupercluster from "use-supercluster";
import type { DeviceClusterProperties } from "~/routes/explore";
import { useNavigate } from "@remix-run/react";
import DonutChartCluster from "./donut-chart-cluster";
import { Box, Rocket } from "lucide-react";
import BoxMarker from "./box-marker";

// supercluster options
const options = {
  radius: 50,
  maxZoom: 14,
  map: (props: any) => ({ categories: { [props.status]: 1 } }),
  reduce: (accumulated: any, props: any) => {
    const categories: any = {};
    // clone the categories object from the accumulator
    for (const key in accumulated.categories) {
      categories[key] = accumulated.categories[key];
    }
    // add props' category data to the clone
    for (const key in props.categories) {
      if (key in accumulated.categories) {
        categories[key] = accumulated.categories[key] + props.categories[key];
      } else {
        categories[key] = props.categories[key];
      }
    }
    // assign the clone to the accumulator
    accumulated.categories = categories;
  },
};

export default function ClusterLayer({
  data,
}: {
  data: {
    devices: FeatureCollection<Point, any>;
    user: null;
    profile: null;
  };
}) {
  const { osem: mapRef } = useMap();

  // get clusters
  const points: PointFeature<GeoJsonProperties & Device>[] = useMemo(() => {
    return data.devices.features.map((device) => ({
      type: "Feature",
      properties: {
        cluster: false,
        ...device.properties,
      },
      geometry: device.geometry,
    }));
  }, [data.devices.features]);

  const bounds = mapRef
    ? (mapRef.getMap().getBounds().toArray().flat() as BBox)
    : ([-92, -72, 193, 76] as BBox);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: mapRef?.getZoom() ?? 10,
    options,
  });

  const clusterOnClick = useCallback(
    (cluster: DeviceClusterProperties) => {
      // supercluster from hook can be null or undefined
      if (!supercluster) return;

      const [longitude, latitude] = cluster.geometry.coordinates;

      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(cluster.id as number),
        20
      );

      mapRef?.getMap().flyTo({
        center: [longitude, latitude],
        animate: true,
        speed: 1.6,
        zoom: expansionZoom,
        essential: true,
      });
    },
    [mapRef, supercluster]
  );

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
        <BoxMarker
          key={`device-${(cluster.properties as Device).id}`}
          latitude={latitude}
          longitude={longitude}
          device={cluster.properties as Device}
        />
      );
    });
  }, [clusterOnClick, clusters]);

  return clusterMarker;
}
