import { useState, useEffect, useMemo } from "react";
import { Source, Layer, useMap, Popup } from "react-map-gl";
import { point, featureCollection } from "@turf/helpers";
import bbox from "@turf/bbox";
import type { FeatureCollection, Point } from "geojson";
import type { LocationPoint } from "~/lib/mobile-box-helper";
import { categorizeIntoTrips } from "~/lib/mobile-box-helper";
import MapLegend from "./mobile-overview-legend";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";

const FIT_PADDING = 100;

// Function to generate or select unique colors
function generateColors(count: number): string[] {
  const colors = [
    "#66c2a5",
    "#fc8d62",
    "#8da0cb",
    "#e78ac3",
    "#a6d854",
    "#ffd92f",
  ];
  while (colors.length < count) {
    // repeat colors if needed
    colors.push(...colors);
  }
  return colors.slice(0, count);
}

export default function MobileOverviewLayer({
  locations,
}: {
  locations: LocationPoint[];
}) {
  // Generate trips and assign colors once
  const trips = useMemo(
    () => categorizeIntoTrips(locations, 50, 600),
    [locations],
  );

  const [sourceData, setSourceData] = useState<FeatureCollection<
    Point,
    { color: string; tripNumber: number; timestamp: string }
  > | null>(null);
  const { osem: mapRef } = useMap();

  // Legend items state
  const [legendItems, setLegendItems] = useState<
    { label: string; color: string }[]
  >([]);

  // State to track the highlighted trip number
  const [highlightedTrip, setHighlightedTrip] = useState<number | null>(null);

  // State to track the popup information
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    startTime: string;
    endTime: string;
  } | null>(null);

  useEffect(() => {
    if (!trips || trips.length === 0) return;

    const colors = generateColors(trips.length);

    // Convert trips into GeoJSON Points with a stable color for each trip
    const points = trips.flatMap((trip, index) =>
      trip.points.map((location) =>
        point([location.geometry.x, location.geometry.y], {
          color: colors[index], // Assign stable color per trip
          tripNumber: index + 1, // Add trip number metadata
          timestamp: location.time, // Add timestamp metadata
        }),
      ),
    );

    // Set legend items for the trips
    const legend = trips.map((_, index) => ({
      label: `Trip ${index + 1}`,
      color: colors[index],
    }));

    setSourceData(featureCollection(points));
    setLegendItems(legend); // Set the legend items
  }, [trips]);

  useEffect(() => {
    if (!mapRef || !sourceData) return;

    const bounds = bbox(sourceData).slice(0, 4) as [
      number,
      number,
      number,
      number,
    ];
    mapRef.fitBounds(bounds, {
      padding: {
        top: FIT_PADDING,
        bottom: FIT_PADDING,
        left: 500,
        right: FIT_PADDING,
      },
    });
  }, [mapRef, sourceData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleHover = (event: any) => {
    if (event.features && event.features.length > 0) {
      const feature = event.features[0];
      const { tripNumber } = feature.properties;
      setHighlightedTrip(tripNumber); // Highlight the trip

      // Find the corresponding trip to get the time range
      const hoveredTrip = trips[tripNumber - 1];
      if (hoveredTrip) {
        const { startTime, endTime } = hoveredTrip;
        const [longitude, latitude] = feature.geometry.coordinates;
        setPopupInfo({ longitude, latitude, startTime, endTime });
      }
    } else {
      setHighlightedTrip(null); // Reset highlight if no feature is hovered
      setPopupInfo(null); // Hide the popup
    }
  };

  useEffect(() => {
    if (!mapRef) return;

    mapRef.on("mousemove", "box-overview-layer", (event) => {
      mapRef.getCanvas().style.cursor = event.features?.length ? "pointer" : "";
      handleHover(event);
    });
    mapRef.on("mouseleave", "box-overview-layer", () => {
      mapRef.getCanvas().style.cursor = "";
      setHighlightedTrip(null);
      setPopupInfo(null); // Hide popup on mouse leave
    });

    // Cleanup events on unmount
    return () => {
      mapRef.off("mousemove", "box-overview-layer", handleHover);
      mapRef.off("mouseleave", "box-overview-layer", () => {});
    };
  }, [handleHover, mapRef, trips]);

  if (!sourceData) return null;

  return (
    <>
      <Source id="box-overview-source" type="geojson" data={sourceData}>
        <Layer
          id="box-overview-layer"
          type="circle"
          source="box-overview-source"
          paint={{
            "circle-color": ["get", "color"],
            "circle-radius": 3,
            "circle-opacity": [
              "case",
              ["==", ["get", "tripNumber"], highlightedTrip],
              1, // Full opacity for the highlighted trip
              0.2, // Reduced opacity for other trips
            ],
          }}
        />
      </Source>
      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          closeButton={false}
          closeOnClick={false}
          anchor="top"
        >
          <div className="flex items-center justify-center mb-2">
            <CalendarClock className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-1 text-center">
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                From
              </span>
              <p className="text-sm font-bold text-primary">
                {format(new Date(popupInfo.startTime), "PPpp")}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                To
              </span>
              <p className="text-sm font-bold text-primary">
                {format(new Date(popupInfo.endTime), "PPpp")}
              </p>
            </div>
          </div>
        </Popup>
      )}
      {/* Pass legend items to the MapLegend component */}
      <MapLegend items={legendItems} position="top-right" />
    </>
  );
}
