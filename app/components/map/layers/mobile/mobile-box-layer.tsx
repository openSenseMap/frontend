import type { Sensor } from "~/schema";
import {
  featureCollection,
  lineString,
  multiLineString,
  point,
} from "@turf/helpers";
import type { MultiLineString, Point } from "geojson";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl";
import bbox from "@turf/bbox";
import { HIGH_COLOR, LOW_COLOR, createPalette } from "./color-palette";
import mapboxgl from "mapbox-gl";

interface CustomGeoJsonProperties {
  locationId: number;
  value: number;
  createdAt: Date;
  color: string;
}

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
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const { osem: mapRef } = useMap();

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
          locationId: measurement.location.id,
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
        top: 100,
        bottom: 400,
        left: 500,
        right: 100,
      },
    });
  }, [mapRef, sourceData]);

  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap();

    map.on("mousemove", "box-layer-point", (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const { locationId } = feature.properties as CustomGeoJsonProperties;

      setHoveredPoint(locationId); // Update hoveredPoint dynamically
    });

    map.on("mouseleave", "box-layer-point", () => {
      setHoveredPoint(null); // Clear hoveredPoint
    });
  }, [mapRef, setHoveredPoint]);

  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap();

    // Cleanup previous popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (hoveredPoint !== null) {
      const feature = sourceData?.features.find(
        (feat) => feat.properties?.locationId === hoveredPoint,
      );

      if (feature && feature.geometry.type === "Point") {
        const { coordinates } = feature.geometry;
        const { value } = feature.properties as CustomGeoJsonProperties;

        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "highlight-popup",
        })
          .setLngLat(coordinates as [number, number])
          .setHTML(
            `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
               <strong>${sensor.title}</strong>
               <strong>${value}${sensor.unit}</strong>
             </div>`,
          )
          .addTo(map);
      }
    } else if (popupRef.current) {
      (popupRef.current as mapboxgl.Popup).remove();
      popupRef.current = null;
    }
  }, [hoveredPoint, sourceData, mapRef, sensor.title]);

  if (!sourceData) return null;

  return (
    <>
      <Source id="box-source" type="geojson" data={sourceData}>
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
        />
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
          id="highlighted-layer"
          source="box-source"
          filter={["==", ["get", "locationId"], hoveredPoint ?? -1]} // Filter only the highlighted feature
          type="circle"
          paint={{
            "circle-color": ["get", "color"],
            "circle-radius": 8,
            "circle-opacity": 1,
          }}
          beforeId="box-layer-point" // Ensure this layer is above the point layer
        />
      </Source>
    </>
  );
}
