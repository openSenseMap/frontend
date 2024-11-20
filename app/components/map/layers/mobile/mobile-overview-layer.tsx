import { useState, useEffect, useMemo } from "react";
import { Source, Layer, useMap } from "react-map-gl";
import { point, featureCollection } from "@turf/helpers";
import bbox from "@turf/bbox";
import type { FeatureCollection, Point } from "geojson";
import type { LocationPoint } from "~/lib/mobile-box-helper";
import { categorizeIntoTrips } from "~/lib/mobile-box-helper";

const FIT_PADDING = 100;

// Function to generate or select unique colors
function generateColors(count: number): string[] {
  const colors = [
    "#ff0000", // red
    "#00ff00", // green
    "#0000ff", // blue
    "#ff00ff", // magenta
    "#00ffff", // cyan
    "#ffff00", // yellow
  ];
  while (colors.length < count) {
    colors.push(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
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
    { color: string }
  > | null>(null);
  const { osem: mapRef } = useMap();

  useEffect(() => {
    if (!trips || trips.length === 0) return;

    const colors = generateColors(trips.length);

    // Convert trips into GeoJSON Points with a stable color for each trip
    const points = trips.flatMap((trip, index) =>
      trip.points.map((location) =>
        point([location.geometry.x, location.geometry.y], {
          color: colors[index], // Assign stable color per trip
        }),
      ),
    );

    setSourceData(featureCollection(points));
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

  if (!sourceData) return null;

  return (
    <Source id="box-overview-source" type="geojson" data={sourceData}>
      <Layer
        id="box-overview-layer"
        type="circle"
        source="box-overview-source"
        paint={{
          "circle-color": ["get", "color"],
          "circle-radius": 5,
        }}
      />
    </Source>
  );
}
