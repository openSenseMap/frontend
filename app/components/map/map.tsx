import { forwardRef } from "react";
import  { type MapProps, type MapRef, NavigationControl, Map as ReactMap  } from "react-map-gl";

const Map = forwardRef<MapRef, MapProps>(
  (
    // take fog and terrain out of props to resolve error
    { children, mapStyle, fog = null, terrain = null, ...props },
    ref,
  ) => {
    // get theme from tailwind
    const [theme] = "light"; //useTheme();
    return (
      <ReactMap
        id="osem"
        dragRotate={false}
        initialViewState={{
          longitude: 7.628202,
          latitude: 51.961563,
          zoom: 2,
        }}
        mapStyle={
          theme === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12"
        }
        mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
        pitchWithRotate={false}
        projection={{ name: "globe" }}
        preserveDrawingBuffer
        hash={true}
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
        <NavigationControl position="bottom-right" showCompass={false} />
      </ReactMap>
    );
  },
);

Map.displayName = "Map";

export default Map;
