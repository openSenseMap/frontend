import { forwardRef, useEffect } from "react";
import { type MapProps, type MapRef, NavigationControl, Map as ReactMap } from "react-map-gl";
import type { Map as MapboxMap, AnyLayer, MapboxEvent } from "mapbox-gl";

interface CustomMapProps extends MapProps {
  language?: string; // 'de', 'en', 'fr', etc.
}

const Map = forwardRef<MapRef, CustomMapProps>(
  (
    { children, mapStyle, language="en", fog = null, terrain = null, ...props },
    ref,
  ) => {
    const [theme] = "light";
    
    const updateMapLanguage = (map: MapboxMap, locale: string) => {
      if (!map) return;
      
      const style = map.getStyle();
      if (!style || !style.layers) return;
      
      style.layers.forEach((layer: AnyLayer) => {
        const layerAny = layer as any;
        const layout = layerAny.layout;
        if (layout && typeof layout === "object" && 'text-field' in layout) {
          const layerId = layerAny.id;
          map.setLayoutProperty(layerId, 'text-field', [
            'coalesce',
            ['get', `name_${locale}`],
            ['get', 'name'],
          ]);
        }
      });
    };
    
    const handleMapLoad = (event: MapboxEvent<undefined>) => {
      updateMapLanguage(event.target as MapboxMap, language);
    };
    
    // Update language when it changes
    useEffect(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        updateMapLanguage(ref.current.getMap(), language);
      }
    }, [language, ref]);
    
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
          mapStyle || (theme === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12")
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
        onLoad={handleMapLoad}
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