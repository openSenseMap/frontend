import type {
  BBox,
  Feature,
  GeoJsonProperties,
  Geometry,
  GeometryCollection,
} from "geojson";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useCallback, useState, useEffect } from "react";
import { Layer, Marker, Popup, Source, useMap } from "react-map-gl";
import type { PointFeature } from "supercluster";
import useSupercluster from "use-supercluster";
import debounce from "lodash.debounce";
// import type { Campaign, Prisma } from "@prisma/client";
import type { Campaign } from "~/schema";
import type { DeviceClusterProperties } from "~/routes/explore";
import { useSearchParams } from "@remix-run/react";
import { FeatureCollection, Properties } from "@turf/helpers";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function PointLayer({
  campaigns,
}: // setDisplayedCampaigns,
{
  campaigns: Campaign[];
  // setDisplayedCampaigns: Dispatch<SetStateAction<Campaign[]>>;
}) {
  const { osem: mapRef } = useMap();
  const [bounds, setBounds] = useState(
    mapRef?.getMap().getBounds().toArray().flat() as BBox
  );
  const [zoom, setZoom] = useState(mapRef?.getZoom() || 0);
  const [selectedMarker, setSelectedMarker] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>();

  const centerpoints = campaigns
    .map((campaign: Campaign) => {
      if (
        typeof campaign.centerpoint === "object" &&
        campaign.centerpoint !== null &&
        "geometry" in campaign.centerpoint
      ) {
        const centerObject = campaign.centerpoint as any;
        const geometryObject = centerObject.geometry as any;
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
            id: point?.id?.toString() ?? "",
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

  function createGeoJson(clusters: any) {
    const filteredClusters = clusters.filter(
      (cluster: any) => cluster.properties.cluster
    );
    const features: Feature[] = filteredClusters.map((cluster: any) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          cluster.geometry.coordinates.longitude,
          cluster.geometry.coordinates.latitude,
        ],
      },
      properties: {
        id: cluster.id,
      },
    }));
    return {
      type: "FeatureCollection",
      features: features,
    };
  }

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options,
  });

  const geojsonData = useMemo(() => createGeoJson(clusters), [clusters]);
  console.log(geojsonData);

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
      const clickedCampaign = campaigns.filter(
        (campaign: Campaign) => campaign.id === markerId
      );
      // const url = new URL(window.location.href);
      // const query = url.searchParams;
      // query.set("search", selectedCampaign[0].title);
      // query.set("showMap", "true");
      // window.location.href = url.toString();
      // searchParams.append("search", selectedCampaign[0].title);

      setSelectedMarker(markerId);
      // setDisplayedCampaigns(selectedCampaign);
      setSelectedCampaign(clickedCampaign[0]);
      mapRef?.flyTo({
        center: [longitude, latitude],
        duration: 1000,
        zoom: 6,
      });
    },
    [
      campaigns,
      mapRef,
      // setDisplayedCampaigns,
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
          {selectedMarker === cluster.properties.id && (
            <Popup
              latitude={latitude}
              longitude={longitude}
              closeButton={true}
              closeOnClick={false}
              onClose={() => setSelectedMarker("")}
              anchor="bottom"
              maxWidth="400px"
              style={{
                maxHeight: "208px",
                overflowY: "scroll",
              }}
            >
              <Table className="caption-top">
                <TableCaption className="text-lg font-bold">
                  {selectedCampaign?.title}
                </TableCaption>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-bold">Description </TableCell>
                    <TableCell>{selectedCampaign?.description}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Priority</TableCell>
                    <TableCell>{selectedCampaign?.priority}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Exposure</TableCell>
                    <TableCell>{selectedCampaign?.exposure}</TableCell>
                  </TableRow>{" "}
                  <TableRow>
                    <TableCell className="font-bold">StartDate</TableCell>
                    <TableCell>
                      {selectedCampaign?.startDate &&
                        new Date(selectedCampaign?.startDate)
                          .toISOString()
                          .split("T")[0]}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Phenomena</TableCell>
                    <TableCell className="flex flex-col">
                      {selectedCampaign?.phenomena.map((p, i) => (
                        <span key={i}>{p}</span>
                      ))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Popup>
          )}
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
  }, [
    clusters,
    handleClusterClick,
    handleMarkerClick,
    points.length,
    selectedMarker,
  ]);

  return <>{clusterMarker}</>;
}
