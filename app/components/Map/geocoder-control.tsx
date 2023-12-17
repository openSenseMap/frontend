import type { ControlPosition } from "react-map-gl";
import { useControl } from "react-map-gl";
import maplibregl from "maplibre-gl";
// import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
// resolve import error
const MaplibreGeocoder = require("@maplibre/maplibre-gl-geocoder");

const geocoder_api = {
  forwardGeocode: async (config: any) => {
    const features = [];
    try {
      console.log("Starting request");
      const request = `https://nominatim.openstreetmap.org/search?q=${config.query}&format=geojson&polygon_geojson=1&addressdetails=1`;
      const response = await fetch(request);
      const geojson = await response.json();
      for (const feature of geojson.features) {
        const center = [
          feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
          feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2,
        ];
        const point = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: center,
          },
          place_name: feature.properties.display_name,
          properties: feature.properties,
          text: feature.properties.display_name,
          place_type: ["place"],
          center: center,
        };
        features.push(point);
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`);
    }

    return {
      features: features,
    };
  },
  reverseGeocode: async (config: any) => {
    const { latitude, longitude } = config;

    try {
      const request = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`;
      const response = await fetch(request);
      const result = await response.json();

      const country_code = result.address.country_code;
      const country = result.address.country;

      return { country_code, country };
    } catch (e) {
      console.error(`Failed to reverseGeocode with error: ${e}`);
      return null;
    }
  },
};

type GeocoderControlProps = {
  position?: ControlPosition;
  language?: string;
  onResult?: (e: any) => void;
};

export default function GeocoderControl(props: GeocoderControlProps) {
  useControl(
    () => {
      const control = new MaplibreGeocoder(geocoder_api, {
        mapboxgl: maplibregl,
        showResultsWhileTyping: true,
      });

      control.on("result", props.onResult);
      return control;
    },
    {
      position: props.position ?? "top-right",
    }
  );

  return null;
}

export const reverseGeocode = async (latitude: number, longitude: number) => {
  return await geocoder_api.reverseGeocode({ latitude, longitude });
};
