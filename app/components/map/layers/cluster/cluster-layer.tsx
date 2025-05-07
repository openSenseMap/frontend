import {
  type GeoJsonProperties,
  type BBox,
  type FeatureCollection,
  type Point,
  Geometry,
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
    // accumulated the clone to the accumulator
    accumulated.categories = categories;
  },
};

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
  
  // Track the expanded cluster to show spider legs
  const [expandedClusterId, setExpandedClusterId] = useState<number | null>(null);
  
  // Track if legs should be visible
  const [showLegs, setShowLegs] = useState<boolean>(false);
  
  // Control visibility of inter-cluster connections
  const [showClusterConnections, setShowClusterConnections] = useState<boolean>(true);

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

  // Instead of clearing expanded cluster on zoom changes,
  // we'll keep track of last expanded cluster
  const [lastExpandedCoordinates, setLastExpandedCoordinates] = useState<[number, number] | null>(null);
  
  // Set up a timer to ensure legs stay visible
  useEffect(() => {
    // If we've just expanded a cluster, make sure spider legs stay visible
    if (expandedClusterId) {
      setShowLegs(true);
    }
    
    // Keep the legs visible during and after map movement
    return () => {
      // No cleanup needed - we want legs to persist
    };
  }, [expandedClusterId, zoom]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options,
  });

  const clusterOnClick = useCallback(
    (cluster: DeviceClusterProperties) => {
      // supercluster from hook can be null or undefined
      if (!supercluster) return;

      const clusterId = cluster.id as number;
      const [longitude, latitude] = cluster.geometry.coordinates;
      
      // Always set the expanded cluster ID and show legs
      setExpandedClusterId(clusterId);
      setShowLegs(true);
      
      // Store coordinates for persistent legs
      setLastExpandedCoordinates(cluster.geometry.coordinates as [number, number]);

      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        20
      );

      mapRef?.getMap().flyTo({
        center: [longitude, latitude],
        animate: true,
        speed: 2.0, // Slower speed
        zoom: expansionZoom,
        essential: true,
      });
    },
    [mapRef, supercluster]
  );

  // Generate spider leg GeoJSON when a cluster is expanded
  const spiderLegsGeoJSON: FeatureCollection<Geometry, GeoJsonProperties> | null = useMemo(() => {
    // We need either an active expanded cluster ID or last known coordinates to draw legs
    if ((!expandedClusterId && !lastExpandedCoordinates) || !supercluster) return null;

    let parentCoordinates: [number, number];
    let childrenClusters: any[] = [];
    
    if (expandedClusterId) {
      // Find the expanded cluster
      const expandedCluster = clusters.find(
        cluster => cluster.properties.cluster && cluster.properties.cluster_id === expandedClusterId
      );
      
      if (!expandedCluster) {
        // If expanded cluster not found but we have last coordinates, use those
        if (lastExpandedCoordinates) {
          parentCoordinates = lastExpandedCoordinates;
        } else {
          return null;
        }
      } else {
        // Get coordinates from the active expanded cluster
        parentCoordinates = expandedCluster.geometry.coordinates as [number, number];
      }
      
      try {
        // Get only the child clusters (not individual points)
        if (expandedClusterId) {
          childrenClusters = supercluster.getChildren(expandedClusterId).filter(
            child => child.properties.cluster
          );
        }
      } catch (error) {
        // If error getting children (like after zoom change), try to find nearby clusters
        const radius = 0.05; // Larger radius to find more clusters
        const bbox: BBox = [
          parentCoordinates[0] - radius,
          parentCoordinates[1] - radius,
          parentCoordinates[0] + radius,
          parentCoordinates[1] + radius
        ];
        
        // Get clusters at the current zoom level within the bbox
        const nearbyClusters = supercluster.getClusters(bbox, Math.floor(zoom));
        
        // Filter to only include clusters (not points)
        childrenClusters = nearbyClusters.filter(item => 
          item.properties.cluster && 
          (item.geometry.coordinates[0] !== parentCoordinates[0] || 
           item.geometry.coordinates[1] !== parentCoordinates[1])
        );
      }
    } else if (lastExpandedCoordinates) {
      // Use the last known coordinates if no active expanded cluster
      parentCoordinates = lastExpandedCoordinates;
      
      // Find clusters within a larger radius from the parent coordinates
      const radius = 0.05; // Larger radius
      const bbox: BBox = [
        parentCoordinates[0] - radius,
        parentCoordinates[1] - radius,
        parentCoordinates[0] + radius,
        parentCoordinates[1] + radius
      ];
      
      // Get only clusters, not individual points
      childrenClusters = supercluster.getClusters(bbox, Math.floor(zoom))
        .filter(item => 
          item.properties.cluster && 
          (item.geometry.coordinates[0] !== parentCoordinates[0] || 
           item.geometry.coordinates[1] !== parentCoordinates[1])
        );
    } else {
      return null;
    }
    
    const features = [];
    const [parentLng, parentLat] = parentCoordinates;
    
    // Only add lines to child clusters - with prominent styling
    for (const childCluster of childrenClusters) {
      const [childLng, childLat] = childCluster.geometry.coordinates;
      
      features.push({
        type: "Feature" as const,
        properties: {
          isParentConnection: true, // Mark as parent-to-child connection
          parentId: expandedClusterId,
          childId: childCluster.properties.cluster_id
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [parentLng, parentLat],
            [childLng, childLat]
          ]
        }
      });
    }

    return {
      type: "FeatureCollection" as const,
      features
    };
  }, [expandedClusterId, supercluster, clusters, zoom, lastExpandedCoordinates]);

  // Generate GeoJSON for connections between all visible clusters
  const clusterConnectionsGeoJSON: FeatureCollection<Geometry, GeoJsonProperties> | null = useMemo(() => {
    if (!showClusterConnections || !clusters || clusters.length === 0) return null;
    
    // Extract only the clusters (not individual points)
    const visibleClusters = clusters.filter(c => c.properties.cluster);
    
    if (visibleClusters.length <= 1) return null;
    
    const features = [];
    const processedPairs = new Set(); // To avoid duplicate connections
    
    // Get connections between clusters based on proximity
    for (let i = 0; i < visibleClusters.length; i++) {
      const clusterA = visibleClusters[i];
      const [lngA, latA] = clusterA.geometry.coordinates;
      
      // For each cluster, connect to the nearest 2-3 clusters
      const nearestClusters = [];
      
      for (let j = 0; j < visibleClusters.length; j++) {
        if (i === j) continue; // Skip self
        
        const clusterB = visibleClusters[j];
        const [lngB, latB] = clusterB.geometry.coordinates;
        
        // Calculate distance using simple Euclidean distance (sufficient for visualization)
        const distance = Math.sqrt(
          Math.pow(lngA - lngB, 2) + Math.pow(latA - latB, 2)
        );
        
        nearestClusters.push({ cluster: clusterB, distance });
      }
      
      // Sort by distance and take the nearest 2 clusters (or less if not available)
      nearestClusters.sort((a, b) => a.distance - b.distance);
      const maxConnections = Math.min(2, nearestClusters.length);
      
      for (let k = 0; k < maxConnections; k++) {
        const nearCluster = nearestClusters[k].cluster;
        const [lngB, latB] = nearCluster.geometry.coordinates;
        
        // Create a unique pair ID to avoid duplicate connections
        const clusterIdA = clusterA.properties.cluster_id;
        const clusterIdB = nearCluster.properties.cluster_id;
        const pairId = [clusterIdA, clusterIdB].sort().join('-');
        
        if (!processedPairs.has(pairId) && nearestClusters[k].distance < 0.5) { // Limit by distance
          processedPairs.add(pairId);
          
          features.push({
            type: "Feature" as const,
            properties: {
              isParentConnection: false, // Mark as cluster-to-cluster connection
              clusterId1: clusterIdA,
              clusterId2: clusterIdB,
              distance: nearestClusters[k].distance
            },
            geometry: {
              type: "LineString" as const,
              coordinates: [
                [lngA, latA],
                [lngB, latB]
              ]
            }
          });
        }
      }
    }
    
    return {
      type: "FeatureCollection" as const,
      features
    };
  }, [clusters, showClusterConnections]);

  const clusterMarker = useMemo(() => {
    return clusters.map((cluster) => {
      // every cluster point has coordinates
      const [longitude, latitude] = cluster.geometry.coordinates;
      // the point may be either a cluster or a crime point
      const { cluster: isCluster } = cluster.properties;

      // we have a cluster to render
      if (isCluster) {
        // Highlight the expanded cluster
        const isExpanded = cluster.properties.cluster_id === expandedClusterId;
        
        return (
          <Marker
            key={`cluster-${cluster.id}`}
            latitude={latitude}
            longitude={longitude}
          >
            <DonutChartCluster
              cluster={cluster}
              clusterOnClick={clusterOnClick}
              isExpanded={isExpanded}
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
  }, [clusterOnClick, clusters, expandedClusterId]);

  // Toggle cluster connections when map zoom changes
  useEffect(() => {
    // Only show cluster connections at lower zoom levels
    if (zoom < 14) {
      setShowClusterConnections(true);
    } else {
      setShowClusterConnections(false);
    }
  }, [zoom]);

  return (
    <>
      {/* Inter-cluster connections layer */}
      {clusterConnectionsGeoJSON && (
        <Source id="cluster-connections" type="geojson" data={clusterConnectionsGeoJSON}>
          <Layer
            id="cluster-connections-layer"
            type="line"
            paint={{
              'line-color': '#575757',
              'line-width': 2,
              'line-opacity': 0.8,
              'line-dasharray': [2, 2]
            }}
          />
        </Source>
      )}
      
      {/* Spider legs layer - only showing connections to subclusters */}
      {spiderLegsGeoJSON && showLegs && (
        <Source id="spider-legs" type="geojson" data={spiderLegsGeoJSON}>
          <Layer
            id="spider-legs-cluster-layer"
            type="line"
            filter={['==', ['get', 'isParentConnection'], true]}
            paint={{
              'line-color': '#38AADD', // Blue accent color
              'line-width': 2.5,
              'line-opacity': 0.8,
              'line-dasharray': [2, 1]
            }}
          />
        </Source>
      )}
      
      {clusterMarker}
    </>
  );
}