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
