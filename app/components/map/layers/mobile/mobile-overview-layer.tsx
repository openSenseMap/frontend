import { useState, useEffect, useMemo, useCallback } from "react";
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
  const [showOriginalColors, setShowOriginalColors] = useState(true);

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

  const handleHover = useCallback(
    (event: any) => {
      if (!showOriginalColors) {
        setHighlightedTrip(null); // Ensure no highlight
        setPopupInfo(null); // Ensure no popup
        return;
      }

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
    },
    [showOriginalColors, trips], // Add dependencies here
  );

  useEffect(() => {
    if (!mapRef) return;

    const onMouseMove = (event: any) => {
      if (!showOriginalColors) {
        mapRef.getCanvas().style.cursor = ""; // Reset cursor
        return;
      }

      mapRef.getCanvas().style.cursor = event.features?.length ? "pointer" : "";
      handleHover(event);
    };

    const onMouseLeave = () => {
      if (!showOriginalColors) return;
      mapRef.getCanvas().style.cursor = ""; // Reset cursor
      setHighlightedTrip(null);
      setPopupInfo(null); // Hide popup on mouse leave
    };

    mapRef.on("mousemove", "box-overview-layer", onMouseMove);
    mapRef.on("mouseleave", "box-overview-layer", onMouseLeave);

    // Cleanup events on unmount or when `showOriginalColors` changes
    return () => {
      mapRef.off("mousemove", "box-overview-layer", onMouseMove);
      mapRef.off("mouseleave", "box-overview-layer", onMouseLeave);
    };
  }, [mapRef, handleHover, showOriginalColors, trips]);

  if (!sourceData) return null;

  return (
    <>
      <Source id="box-overview-source" type="geojson" data={sourceData}>
        <Layer
          id="box-overview-layer"
          type="circle"
          source="box-overview-source"
          paint={{
            "circle-color": showOriginalColors ? ["get", "color"] : "#888", // Single color when toggled off
            "circle-radius": 3,
            "circle-opacity": showOriginalColors
              ? [
                  "case",
                  ["==", ["get", "tripNumber"], highlightedTrip],
                  1, // Full opacity for the highlighted trip
                  0.2, // Reduced opacity for other trips
                ]
              : 1, // Always full opacity when showing a single color
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
              <p className="text-sm font-bold text-primary">
                {format(new Date(popupInfo.startTime), "Pp")}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                To
              </span>
              <p className="text-sm font-bold text-primary">
                {format(new Date(popupInfo.endTime), "Pp")}
              </p>
            </div>
          </div>
        </Popup>
      )}
      <MapLegend
        items={legendItems}
        position="top-right"
        toggleTrips={() => setShowOriginalColors(!showOriginalColors)}
        showOriginalColors={showOriginalColors}
      />
    </>
  );
}
