import type { MapProps, MapRef } from "react-map-gl";
import { NavigationControl, Map as ReactMap } from "react-map-gl";
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
          longitude: 10,
          latitude: 25,
          zoom: 2,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
        pitchWithRotate={false}
        preserveDrawingBuffer
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          position: "fixed",
          top: 0,
          left: 0,
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
