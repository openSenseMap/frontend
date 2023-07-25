import type { BBox, GeoJsonProperties } from "geojson";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useCallback, useState, useEffect } from "react";
import { Marker, useMap } from "react-map-gl";
import type { PointFeature } from "supercluster";
import useSupercluster from "use-supercluster";
import debounce from "lodash.debounce";
import type { Campaign, Prisma } from "@prisma/client";
import type { DeviceClusterProperties } from "~/routes/explore";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getCampaigns } from "~/models/campaign.server";
import { useLoaderData } from "@remix-run/react";

type PointProperties = {
  title: string;
  cluster: boolean;
  point_count: number;
  id: string;
  // color: string;
  // selected: boolean;
};

const DEBOUNCE_VALUE = 50;

const options = {
  radius: 50,
  maxZoom: 14,
};

// export async function loader({ params, request }: LoaderArgs) {
//   const campaigns = await getCampaigns(options);
//   return json({ campaigns });
// }

export default function PointLayer({
  campaigns,
  setDisplayedCampaigns,
  setSelectedCampaign,
  setSelectedMarker,
}: {
  campaigns: Campaign[];
  setDisplayedCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  setSelectedCampaign: Dispatch<SetStateAction<string>>;
  setSelectedMarker: Dispatch<SetStateAction<string>>;
}) {
  const { osem: mapRef } = useMap();
  const [bounds, setBounds] = useState(
    mapRef?.getMap().getBounds().toArray().flat() as BBox
  );
  const [zoom, setZoom] = useState(mapRef?.getZoom() || 0);

  const centerpoints = campaigns
    .map((campaign: Campaign) => {
      if (
        typeof campaign.centerpoint === "object" &&
        campaign.centerpoint !== null &&
        "geometry" in campaign.centerpoint
      ) {
        const centerObject = campaign.centerpoint as Prisma.JsonObject;
        const geometryObject = centerObject.geometry as Prisma.JsonObject;
        if (centerObject && geometryObject) {
          return {
            coordinates: geometryObject.coordinates,
            title: campaign.title,
            id: campaign.id,
          };
        }
      } else {
        return null;
      }
    })
    .filter((coords) => coords !== null);

  const points: PointFeature<GeoJsonProperties & PointProperties>[] =
    useMemo(() => {
      return centerpoints.map(
        (point: PointFeature<GeoJsonProperties & PointProperties>) => ({
          type: "Feature",
          properties: {
            cluster: false,
            point_count: 1,
            color: "blue",
            selected: false,
            title: point?.title ?? "",
            id: point?.id ?? "",
          },
          geometry: {
            type: "Point",
            // @ts-ignore
            coordinates: point.coordinates,
          },
        })
      );
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

  const handleMarkerClick = useCallback(
    (markerId: string, latitude: number, longitude: number) => {
      const selectedCampaign = campaigns.filter(
        (campaign: Campaign) => campaign.id === markerId
      );
      console.log(selectedCampaign);

      setSelectedMarker(markerId);
      setDisplayedCampaigns(selectedCampaign);
      setSelectedCampaign(selectedCampaign[0].id);
      mapRef?.flyTo({
        center: [longitude, latitude],
        duration: 1000,
        zoom: 6,
      });
    },
    [
      campaigns,
      mapRef,
      setDisplayedCampaigns,
      setSelectedCampaign,
      setSelectedMarker,
    ]
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
              onClick={() => handleClusterClick(cluster)}
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
            onClick={() =>
              handleMarkerClick(cluster.properties.id, latitude, longitude)
            }
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
  }, [clusters, handleClusterClick, handleMarkerClick, points.length]);

  return <>{clusterMarker}</>;
}
