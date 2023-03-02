import React, { useRef, useEffect, useState } from "react";
import type { Map } from "maplibre-gl";
import maplibregl from "maplibre-gl";

interface MapProps extends React.InputHTMLAttributes<HTMLInputElement> {
  latitude?: number;
  longitude?: number;
}

export type MapContextValue = {
  map: Map | null;
};

export const MapContext = React.createContext<MapContextValue>({
  map: null,
});

export default function MyMap({ latitude = 7, longitude = 52 }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

  const { current: contextValue } = useRef<MapContextValue>({ map: null });

  useEffect(() => {
    if (contextValue.map) return; //stops map from intializing more than once

    let map: Map;

    const initialState = {
      lng: longitude,
      lat: latitude,
      zoom: 2,
    };

    if (mapContainer.current) {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets/style.json?key=${ENV.MAPTILER_KEY}`,
        center: [initialState.lng, initialState.lat],
        zoom: initialState.zoom,
      });

      contextValue.map = map;

      setMapInstance(map);
    }

    return () => {
      if (mapInstance) {
        map.remove();
      }
    };
  }, [contextValue, longitude, latitude]);

  return (
    <div className="h-full min-h-full w-full">
      <div ref={mapContainer} className="h-full w-full">
        <MapContext.Provider value={contextValue}></MapContext.Provider>
      </div>
    </div>
  );
}
