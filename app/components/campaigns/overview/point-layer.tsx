import type {
  GeoJsonProperties,
  BBox,
  FeatureCollection,
  Point,
} from "geojson";
import { useMemo, useCallback, useState, useEffect } from "react";
import { Marker, useMap } from "react-map-gl";
import type { PointFeature } from "supercluster";
import useSupercluster from "use-supercluster";
import debounce from "lodash.debounce";

type PointProperties = {
  title: string;
  cluster: boolean;
  point_count: any;
  id: string;
  // color: string;
  // selected: boolean;
};

const DEBOUNCE_VALUE = 50;

const options = {
  radius: 50,
  maxZoom: 14,
  //   map: (props: any) => ({ categories: { [props.status]: 1 } }),
  //   reduce: (accumulated: any, props: any) => {
  //     const categories: any = {};
  //     // clone the categories object from the accumulator
  //     for (const key in accumulated.categories) {
  //       categories[key] = accumulated.categories[key];
  //     }
  //     // add props' category data to the clone
  //     for (const key in props.categories) {
  //       if (key in accumulated.categories) {
  //         categories[key] = accumulated.categories[key] + props.categories[key];
  //       } else {
  //         categories[key] = props.categories[key];
  //       }
  //     }
  //     // assign the clone to the accumulator
  //     accumulated.categories = categories;
  //   },
};

export default function PointLayer({
  centerpoints,
}: {
  centerpoints: PointFeature<PointProperties>[];
}) {
  const { osem: mapRef } = useMap();
  const [bounds, setBounds] = useState(
    mapRef?.getMap().getBounds().toArray().flat() as BBox
  );
  const [zoom, setZoom] = useState(mapRef?.getZoom() || 0);

  const points: Array<PointFeature<PointProperties>> = useMemo(() => {
    return centerpoints.map((point: any) => ({
      type: "Feature",
      properties: {
        cluster: false,
        point_count: 1,
        title: point?.title,
        id: point?.id,
        color: "blue",
        selected: false,
      },
      geometry: {
        type: "Point",
        coordinates: point?.coordinates,
      },
    }));
  }, [centerpoints]);

  const debouncedChangeHandler = debounce(() => {
    if (!mapRef) return;
    setBounds(mapRef.getMap().getBounds().toArray().flat() as BBox);
    setZoom(mapRef.getZoom());
  }, DEBOUNCE_VALUE);

  // register the debounced change handler to map events
  useEffect(() => {
    if (!mapRef) return;

    mapRef?.getMap().on("load", debouncedChangeHandler);
    mapRef?.getMap().on("zoom", debouncedChangeHandler);
    mapRef?.getMap().on("move", debouncedChangeHandler);
    mapRef?.getMap().on("resize", debouncedChangeHandler);
  }, [debouncedChangeHandler, mapRef]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options,
  });

  const handleClusterClick = useCallback(
    (latitude: number, longitude: number) => {
      mapRef?.flyTo({
        center: [longitude, latitude],
        duration: 2000,
        zoom: zoom + 2, // maybe just hardcoaded number
      });
    },
    [zoom]
  );

  const clusterMarker = useMemo(() => {
    return clusters.map((cluster) => {
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
              className="flex items-center justify-center rounded-full bg-blue-500 p-4"
              style={{
                width: `${10 + (pointCount / points.length) * 20}px`,
                height: `${10 + (pointCount / points.length) * 20}px`,
              }}
              onClick={() => handleClusterClick(latitude, longitude)}
            >
              {pointCount}
            </div>
          </Marker>
        );
      }

      // we have a single device to render
      return (
        <>
          <Marker
            // color={color}
            key={`${cluster.properties.id}`}
            latitude={latitude}
            longitude={longitude}
            // onClick={() =>
            //   handleMarkerClick(
            //     cluster.properties.id,
            //     latitude,
            //     longitude
            //   )
            // }
          ></Marker>
          <Marker
            key={`span-${cluster.properties.id}`}
            latitude={latitude}
            longitude={longitude}
            anchor="top"
          >
            <span className="font-bold">{cluster.properties.title}</span>
          </Marker>
        </>
      );
    });
  }, [clusters]);

  return <>{clusterMarker}</>;
}
