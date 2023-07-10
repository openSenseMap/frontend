import type { Sensor } from "@prisma/client";
import {
  featureCollection,
  lineString,
  multiLineString,
  point,
} from "@turf/helpers";
import type { MultiLineString, Point } from "geojson";
import { useEffect, useState } from "react";
import { Layer, Source } from "react-map-gl";

export default function MobileBoxLayer({ sensor }: { sensor: Sensor }) {
  const [sourceData, setSourceData] = useState<GeoJSON.FeatureCollection>();

  useEffect(() => {
    const points = (
      sensor.data! as unknown as {
        value: String;
        location?: number[];
        createdAt: Date;
      }[]
    ).map((measurement) => point(measurement.location!));

    if (points.length === 0) return;

    // generate a line from the points
    const line = lineString(points.map((point) => point.geometry.coordinates));
    const lines = multiLineString([line.geometry.coordinates]);

    setSourceData(
      featureCollection<Point | MultiLineString>([...points, lines])
    );
  }, [sensor.data]);

  if (!sourceData) return null;

  return (
    <Source id="box-source" type="geojson" data={sourceData}>
      <Layer
        id="box-layer-point"
        source="box-source"
        type="circle"
        paint={{
          "circle-color": "red",
          "circle-radius": 4,
        }}
      />
      <Layer
        id="box-layer-line"
        source="box-source"
        type="line"
        paint={{
          "line-color": "red",
          "line-width": 2,
        }}
      />
    </Source>
  );
}
