import type { Map as MapboxMap, AnyLayer, MapboxEvent } from "mapbox-gl";
import { forwardRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { type MapProps, type MapRef, NavigationControl, Map as ReactMap } from "react-map-gl";

const Map = forwardRef<MapRef, MapProps>(
  (
    { children, mapStyle, ...props },
    ref,
  ) => {
    const [theme] = "light";
    const { i18n } = useTranslation();

    const updateMapLanguage = useCallback((map: MapboxMap, locale: string) => {
      if (!map) return;
      
      const style = map.getStyle();
      if (!style || !style.layers) return;
      
      // The Map's common locale codes to Mapbox's supported language codes
      const mapboxLocale = locale.split('-')[0]; // 'en-US' -> 'en', 'de-DE' -> 'de'
      
      style.layers.forEach((layer: AnyLayer) => {
        if (!("layout" in layer) || !layer.layout) return;
        
        const layout = layer.layout as Record<string, unknown>;
        const textField = layout['text-field'];
        
        // Skip the layers without the text-field
        if (!textField) return;
        
        // Skip road shield layers and other special layers that shouldn't be translated
        if (
          layer.id.includes('shield') || 
          layer.id.includes('road-number') ||
          layer.id.includes('exit')
        ) {
          return;
        }
        
        // Only modifying layers that are likely to have localized names
        // These are typically label layers
        if (
          layer.id.includes('label') || 
          layer.id.includes('place') ||
          layer.id.includes('poi') ||
          layer.id.includes('country') ||
          layer.id.includes('state') ||
          layer.id.includes('settlement') ||
          layer.id.includes('continent')
        ) {
          try {
            map.setLayoutProperty(layer.id, 'text-field', [
              'coalesce',
              ['get', `name_${mapboxLocale}`],
              ['get', 'name_en'], // Fallback to English
              ['get', 'name'],    // Final fallback to default name
            ]);
          } catch (e) {
            // Layer might not exist or property might not be settable
            console.warn(`Could not set text-field for layer ${layer.id}:`, e);
          }
        }
      });
    }, []);
    
    const handleMapLoad = useCallback((event: MapboxEvent<undefined>) => {
      updateMapLanguage(event.target as MapboxMap, i18n.language);
    }, [updateMapLanguage, i18n.language]);
    
    // Update language when it changes
    useEffect(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        const map = ref.current.getMap();
        if (map.isStyleLoaded()) {
          updateMapLanguage(map, i18n.language);
        }
      }
    }, [i18n.language, ref, updateMapLanguage]);
    
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