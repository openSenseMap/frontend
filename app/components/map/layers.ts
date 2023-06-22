import type { LayerProps } from "react-map-gl";

export const clusterLayer: LayerProps = {
  id: "osem-data",
  type: "circle",
  source: "osem-data",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#5394d0",
    "circle-radius": 20,
  },
};

export const clusterCountLayer: LayerProps = {
  id: "cluster-count",
  type: "symbol",
  source: "osem-data",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-size": 12,
  },
};

export const unclusteredPointLayer: LayerProps = {
  id: "unclustered-point",
  type: "circle",
  source: "osem-data",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#11b4da",
    "circle-radius": 4,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

export const tempLayer: LayerProps = {
  'id': 'base-layer',
  'type': 'circle',
  'source': 'boxes',
  'paint': {
    'circle-opacity': 0.7,
    'circle-radius': {
      'base': 2.75,
      'stops': [[1,5], [22, 200]]
    },
    'circle-color': [
      'interpolate',
      ['linear'],
      [ "get", "value", ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]]],
      -5, '#9900cc',
      0, '#0000ff',
      10, '#0099ff',
      20, '#ffff00',
      30, '#ff0000'
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': 'black'
  }
}