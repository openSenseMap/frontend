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

interface ObjectLiteral {
  [key: string]: LayerProps;
}

export const phenomenonLayers: ObjectLiteral = {
  temperature: {
    id: "base-layer",
    type: "circle",
    source: "boxes",
    paint: {
      "circle-opacity": 0.7,
      "circle-radius": {
        base: 2.75,
        stops: [
          [1, 5],
          [22, 200],
        ],
      },
      "circle-color": [
        "interpolate",
        ["linear"],
        [
          "get",
          "value",
          ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
        ],
        -10,
        "#9900cc",
        0,
        "#0000ff",
        10,
        "#0099ff",
        20,
        "#ffff00",
        30,
        "#ff0000",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "black",
    },
  },
  relative_humidity: {
    id: "base-layer",
    type: "circle",
    source: "boxes",
    paint: {
      "circle-opacity": 0.7,
      "circle-radius": {
        base: 1.75,
        stops: [
          [1, 4],
          [22, 200],
        ],
      },
      "circle-color": [
        "interpolate",
        ["linear"],
        [
          "get",
          "value",
          ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
        ],
        0,
        "#9900cc",
        25,
        "#0000ff",
        50,
        "#0099ff",
        75,
        "#ffff00",
        100,
        "#ff0000",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "black",
    },
  },
  barometric_pressure: {
    id: "base-layer",
    type: "circle",
    source: "boxes",
    paint: {
      "circle-opacity": 0.7,
      "circle-radius": {
        base: 1.75,
        stops: [
          [1, 4],
          [22, 200],
        ],
      },
      "circle-color": [
        "interpolate",
        ["linear"],
        [
          "get",
          "value",
          ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
        ],
        0,
        "#9900cc",
        25,
        "#0000ff",
        50,
        "#0099ff",
        75,
        "#ffff00",
        100,
        "#ff0000",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "black",
    },
  },
  ambient_light: {
    id: "base-layer",
    type: "circle",
    source: "boxes",
    paint: {
      "circle-opacity": 0.7,
      "circle-radius": {
        base: 1.75,
        stops: [
          [1, 4],
          [22, 200],
        ],
      },
      "circle-color": [
        "interpolate",
        ["linear"],
        [
          "get",
          "value",
          ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
        ],
        0,
        "#9900cc",
        1000,
        "#0000ff",
        2000,
        "#0099ff",
        3000,
        "#ffff00",
        4000,
        "#ff0000",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "black",
    },
  },
  ultraviolet_a_light: {
    id: "base-layer",
    type: "circle",
    source: "boxes",
    paint: {
      "circle-opacity": 0.7,
      "circle-radius": {
        base: 1.75,
        stops: [
          [1, 4],
          [22, 200],
        ],
      },
      "circle-color": [
        "interpolate",
        ["linear"],
        [
          "get",
          "value",
          ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
        ],
        0,
        "#9900cc",
        100,
        "#0000ff",
        200,
        "#0099ff",
        300,
        "#ffff00",
        400,
        "#ff0000",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "black",
    },
  },
  pm10_concentration: {
    id: "base-layer",
    type: "circle",
    source: "boxes",
    paint: {
      "circle-opacity": 0.7,
      "circle-radius": {
        base: 1.75,
        stops: [
          [1, 4],
          [22, 200],
        ],
      },
      "circle-color": [
        "interpolate",
        ["linear"],
        [
          "get",
          "value",
          ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
        ],
        0,
        "#9900cc",
        15,
        "#0000ff",
        30,
        "#0099ff",
        45,
        "#ffff00",
        60,
        "#ff0000",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "black",
    },
  },
  pm25: {
    id: "base-layer",
    type: "circle",
    source: "boxes",
    paint: {
      "circle-opacity": 0.7,
      "circle-radius": {
        base: 1.75,
        stops: [
          [1, 4],
          [22, 200],
        ],
      },
      "circle-color": [
        "interpolate",
        ["linear"],
        [
          "get",
          "value",
          ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
        ],
        0,
        "#9900cc",
        10,
        "#0000ff",
        20,
        "#0099ff",
        30,
        "#ffff00",
        40,
        "#ff0000",
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "black",
    },
  },
};

export const defaultLayer = {
  id: "base-layer",
  type: "circle",
  source: "boxes",
  paint: {
    "circle-opacity": 0.7,
    "circle-radius": {
      base: 1.75,
      stops: [
        [1, 4],
        [22, 200],
      ],
    },
    "circle-color": [
      "interpolate",
      ["linear"],
      [
        "get",
        "value",
        ["object", ["get", "lastMeasurement", ["object", ["get", "sensor"]]]],
      ],
      0,
      "#9900cc",
      25,
      "#0000ff",
      50,
      "#0099ff",
      75,
      "#ffff00",
      100,
      "#ff0000",
    ],
    "circle-stroke-width": 1,
    "circle-stroke-color": "black",
  },
};
