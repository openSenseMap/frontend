import {
  type GeoJsonProperties,
  type BBox,
  type FeatureCollection,
  type Point,
} from "geojson";
import debounce from "lodash.debounce";
import { useMemo, useCallback, useState, useEffect } from "react";
import { Marker, useMap, Source, Layer } from "react-map-gl";
import { type PointFeature } from "supercluster";
import useSupercluster from "use-supercluster";
import BoxMarker from "./box-marker";
import DonutChartCluster from "./donut-chart-cluster";
import { type DeviceClusterProperties } from "~/routes/explore";
import { type Device } from "~/schema";

const DEBOUNCE_VALUE = 50;

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

// State to track expanded clusters and their children
interface ExpandedCluster {
  clusterId: number;
  centerCoordinates: [number, number];
  childrenCoordinates: [number, number][];
  expandedAt: number; // timestamp to track when expanded
}

export default function ClusterLayer({
  devices,
}: {
  devices: FeatureCollection<Point, any>;
}) {
  const { osem: mapRef } = useMap();

  // the viewport bounds and zoom level
  const [bounds, setBounds] = useState(
    mapRef?.getMap().getBounds().toArray().flat() as BBox
  );
  const [zoom, setZoom] = useState(mapRef?.getZoom() || 0);
  
  // Track expanded clusters for spider connections
  const [expandedClusters, setExpandedClusters] = useState<ExpandedCluster[]>([]);
  
  // NEW: State to track animation progress for each cluster
  const [animationProgress, setAnimationProgress] = useState<Map<number, number>>(new Map());

  // get clusters
  const points: PointFeature<GeoJsonProperties & Device>[] = useMemo(() => {
    return devices.features.map((device) => ({
      type: "Feature",
      properties: {
        cluster: false,
        ...device.properties,
      },
      geometry: device.geometry,
    }));
  }, [devices.features]);

  // get bounds and zoom level from the map
  // debounce the change handler to prevent too many updates
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

  // Clean up expired expanded clusters (after 3 seconds or when zoom changes significantly)
  useEffect(() => {
    const currentTime = Date.now();
    const cleanupThreshold = 3000; // 3 seconds
    
    setExpandedClusters(prev => {
      const remaining = prev.filter(expanded => 
        currentTime - expanded.expandedAt < cleanupThreshold
      );
      
      // Clean up animation progress for removed clusters
      setAnimationProgress(current => {
        const newProgress = new Map(current);
        prev.forEach(expanded => {
          if (!remaining.includes(expanded)) {
            newProgress.delete(expanded.clusterId);
          }
        });
        return newProgress;
      });
      
      return remaining;
    });
  }, [zoom, clusters]);

  // NEW: Animation trigger function
  const startSpiderAnimation = useCallback((clusterId: number) => {
    const animationDuration = 800; // 800ms total animation
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      setAnimationProgress(prev => new Map(prev).set(clusterId, progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  const clusterOnClick = useCallback(
    (cluster: DeviceClusterProperties) => {
      // supercluster from hook can be null or undefined
      if (!supercluster) return;

      const [longitude, latitude] = cluster.geometry.coordinates;
      const clusterId = cluster.id as number;

      // Get the expansion zoom level first
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        20
      );

      // Get immediate children (sub-clusters and devices) at the expansion zoom level
      const children = supercluster.getChildren(clusterId);
      
      // Filter only sub-clusters (not individual devices) for spider connections
      const subClusters = children.filter(child => child.properties.cluster === true);
      const subClusterCoordinates: [number, number][] = subClusters.map(subCluster => 
        subCluster.geometry.coordinates as [number, number]
      );

      // Only add spider lines if there are sub-clusters (not just individual devices)
      if (subClusterCoordinates.length > 0) {
        const newExpandedCluster: ExpandedCluster = {
          clusterId,
          centerCoordinates: [longitude, latitude],
          childrenCoordinates: subClusterCoordinates,
          expandedAt: Date.now()
        };

        setExpandedClusters(prev => [...prev, newExpandedCluster]);
        
        // NEW: Start animation after a short delay to let the map start zooming
        setTimeout(() => {
          startSpiderAnimation(clusterId);
        }, 50);
      }

      mapRef?.getMap().flyTo({
        center: [longitude, latitude],
        animate: true,
        speed: 1.6,
        zoom: expansionZoom,
        essential: true,
      });
    },
    [mapRef, supercluster, startSpiderAnimation]
  );

  // MODIFIED: Generate spider connection lines with animation
  const spiderLines = useMemo(() => {
    if (expandedClusters.length === 0) return null;

    const features = expandedClusters.flatMap(expanded => {
      const progress = animationProgress.get(expanded.clusterId) || 0;
      
      return expanded.childrenCoordinates.map((childCoord, index) => {
        // Calculate animation delay for each line
        const lineProgress = Math.max(0, Math.min(1, (progress - index * 0.1) / 0.5));
        
        // Interpolate between start and end coordinates
        const [startLng, startLat] = expanded.centerCoordinates;
        const [endLng, endLat] = childCoord;
        
        const currentLng = startLng + (endLng - startLng) * lineProgress;
        const currentLat = startLat + (endLat - startLat) * lineProgress;
        
        return {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: [
              expanded.centerCoordinates,
              [currentLng, currentLat]
            ]
          },
          properties: {
            clusterId: expanded.clusterId,
            animationProgress: lineProgress
          }
        };
      });
    });

    return {
      type: "FeatureCollection" as const,
      features
    };
  }, [expandedClusters, animationProgress]);

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

  return (
    <>
      {/* MODIFIED: Spider connection lines with animation */}
      {spiderLines && (
        <Source id="spider-lines" type="geojson" data={spiderLines}>
          <Layer
            id="spider-lines-layer"
            type="line"
            paint={{
              "line-color": [
                "interpolate",
                ["linear"],
                ["get", "animationProgress"],
                0, "#4CAF50",
                1, "#2E8B57"
              ],
              "line-width": [
                "interpolate",
                ["linear"],
                ["get", "animationProgress"],
                0, 1,
                0.5, 4,
                1, 3
              ],
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["get", "animationProgress"],
                0, 0.3,
                0.2, 1,
                1, 0.8
              ],
              "line-blur": [
                "interpolate",
                ["linear"],
                ["get", "animationProgress"],
                0, 2,
                1, 0
              ],
              "line-dasharray": [3, 2]
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round"
            }}
          />
        </Source>
      )}
      {clusterMarker}
    </>
  );
}
