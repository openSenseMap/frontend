import type { Sensor } from "@prisma/client";
import {
  featureCollection,
  lineString,
  multiLineString,
  point,
} from "@turf/helpers";
import type { MultiLineString, Point } from "geojson";
import { useEffect, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl";
import chroma from "chroma-js";
import bbox from "@turf/bbox";

const LOW_COLOR = "#375F73";
const HIGH_COLOR = "#B5F584";

const FIT_PADDING = 50;
const BOTTOM_BAR_HEIGHT = 400;

export default function MobileBoxLayer({
  sensor,
  color,
}: {
  sensor: Sensor;
  color?:
    | mapboxgl.CirclePaint["circle-color"]
    | mapboxgl.LinePaint["line-color"];
}) {
  const [sourceData, setSourceData] = useState<GeoJSON.FeatureCollection>();

  const { osem } = useMap();

  useEffect(() => {
    const sensorData = sensor.data! as unknown as {
      value: String;
      location?: number[];
      createdAt: Date;
    }[];

    // create color palette from min and max values
    const minValue = Math.min(...sensorData.map((d) => Number(d.value)));
    const maxValue = Math.max(...sensorData.map((d) => Number(d.value)));

    const palette = chroma
      .scale([LOW_COLOR, HIGH_COLOR])
      .domain([minValue, maxValue]);

    // generate points from the sensor data
    // apply color from palette
    const points = sensorData.map((measurement) =>
      point(measurement.location!, {
        value: Number(measurement.value),
        createdAt: new Date(measurement.createdAt),
        color: palette(Number(measurement.value)).hex(),
      })
    );

    if (points.length === 0) return;

    // generate a line from the points
    const line = lineString(points.map((point) => point.geometry.coordinates));
    const lines = multiLineString([line.geometry.coordinates]);

    setSourceData(
      featureCollection<Point | MultiLineString>([...points, lines])
    );
  }, [sensor.data]);

  // fit the map to the bounds of the data
  useEffect(() => {
    if (!osem || !sourceData) return;
    const [x1, y1, x2, y2] = bbox(sourceData);
    osem?.fitBounds([x1, y1, x2, y2], {
      padding: {
        top: FIT_PADDING,
        bottom: BOTTOM_BAR_HEIGHT + FIT_PADDING,
        left: FIT_PADDING,
        right: FIT_PADDING,
      },
    });
  }, [osem, sourceData]);

  if (!sourceData) return null;

  return (
    <Source id="box-source" type="geojson" data={sourceData}>
      <Layer
        id="box-layer-point"
        source="box-source"
        filter={["==", "$type", "Point"]}
        type="circle"
        paint={{
          "circle-color": ["get", "color"],
          "circle-radius": 5,
        }}
      />
      <Layer
        id="box-layer-line"
        source="box-source"
        type="line"
        filter={["==", "$type", "LineString"]}
        paint={{
          "line-color": color || "#333",
          "line-width": 2,
          "line-opacity": 0.7,
        }}
        beforeId="box-layer-point"
      />
    </Source>
  );
}
