import type { LayerProps } from "react-map-gl";

// colors to use for the categories
const colors = ["#fed976", "#feb24c", "#fd8d3c", "#fc4e2a"];

// filters for classifying devices into three categories based on status
export const deviceStatusFilter = {
  active: ["==", ["get", "status"], "ACTIVE"],
  inactive: ["==", ["get", "status"], "INACTIVE"],
  old: ["==", ["get", "status"], "OLD"],
};

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
    "circle-color": [
      "case",
      deviceStatusFilter.active,
      colors[0],
      deviceStatusFilter.inactive,
      colors[1],
      deviceStatusFilter.old,
      colors[2],
      colors[3],
    ],
    "circle-radius": 8,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};
