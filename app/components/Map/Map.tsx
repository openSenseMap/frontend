import type { MapProps, MapRef } from "react-map-gl";
import { NavigationControl, Map as ReactMap } from "react-map-gl";
import maplibregl from "maplibre-gl";
import { forwardRef } from "react";

const Map = forwardRef<MapRef, MapProps>(
  (
    // take fog and terrain out of props to resolve error
    { children, mapStyle, fog = null, terrain = null, ...props },
    ref
  ) => {
    return (
        <ReactMap
          id="osem"
          dragRotate={false}
          initialViewState={{
            longitude: 7.5,
            latitude: 51.5,
            zoom: 7,
          }}
          mapLib={maplibregl}
          mapStyle={
            mapStyle ||
            `https://api.maptiler.com/maps/streets/style.json?key=${ENV.MAPTILER_KEY}`
          }
          pitchWithRotate={false}
          preserveDrawingBuffer
          ref={ref}
          style={{
            width: "100%",
            height: "100%",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 2,
          }}
          touchZoomRotate={false}
          {...props}
        >
          {children}
          <NavigationControl position="bottom-left" showCompass={false} />
        </ReactMap>
    );
  }
);

Map.displayName = "Map";

export default Map;
