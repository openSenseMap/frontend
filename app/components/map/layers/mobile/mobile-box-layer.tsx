import type { Sensor } from "~/schema";
import {
  featureCollection,
  lineString,
  multiLineString,
  point,
} from "@turf/helpers";
import type { MultiLineString, Point } from "geojson";
import { createContext, useContext, useEffect, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl";
import bbox from "@turf/bbox";
import { HIGH_COLOR, LOW_COLOR, createPalette } from "./color-palette";

const FIT_PADDING = 100;
const BOTTOM_BAR_HEIGHT = 400;

export const HoveredPointContext = createContext({
  hoveredPoint: null,
  setHoveredPoint: (_point: number | null) => {},
});

export default function MobileBoxLayer({
  sensor,
  minColor = LOW_COLOR,
  maxColor = HIGH_COLOR,
}: {
  sensor: Sensor;
  minColor?:
    | mapboxgl.CirclePaint["circle-color"]
    | mapboxgl.LinePaint["line-color"];
  maxColor?:
    | mapboxgl.CirclePaint["circle-color"]
    | mapboxgl.LinePaint["line-color"];
}) {
  const [sourceData, setSourceData] = useState<GeoJSON.FeatureCollection>();
  const { hoveredPoint, setHoveredPoint } = useContext(HoveredPointContext);

  const { osem: mapRef } = useMap();

  useEffect(() => {
    console.log("🚀 HoveredPoint updated:", hoveredPoint);
  }, [hoveredPoint]);

  useEffect(() => {
    const sensorData = sensor.data! as unknown as {
      value: String;
      location: { x: number; y: number; id: number };
      createdAt: Date;
    }[];

    // create color palette from min and max values
    const minValue = Math.min(...sensorData.map((d) => Number(d.value)));
    const maxValue = Math.max(...sensorData.map((d) => Number(d.value)));
    const palette = createPalette(
      minValue,
      maxValue,
      minColor as string,
      maxColor as string,
    );

    // generate points from the sensor data
    // apply color from palette
    const points = sensorData.map((measurement) => {
      const tempPoint = point(
        [measurement.location.x, measurement.location.y],
        {
          value: Number(measurement.value),
          createdAt: new Date(measurement.createdAt),
          color: palette(Number(measurement.value)).hex(),
        },
      );
      return tempPoint;
    });

    if (points.length === 0) return;

    // generate a line from the points
    const line = lineString(points.map((point) => point.geometry.coordinates));
    const lines = multiLineString([line.geometry.coordinates]);

    setSourceData(
      featureCollection<Point | MultiLineString>([...points, lines]),
    );
  }, [maxColor, minColor, sensor.data]);

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
        bottom: BOTTOM_BAR_HEIGHT,
        left: 500,
        right: FIT_PADDING,
      },
    });
  }, [mapRef, sourceData]);

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
          "line-color": "#333",
          "line-width": 2,
          "line-opacity": 0.7,
        }}
        beforeId="box-layer-point"
      />
    </Source>
  );
}
