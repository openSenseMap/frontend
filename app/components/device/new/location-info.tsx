import React, { useRef, useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "~/components/ui/label";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Map,
  Marker,
  NavigationControl,
  GeolocateControl,
  type MapRef,
  type MarkerDragEvent,
  Source,
} from "react-map-gl";

export function LocationStep() {
  const mapRef = useRef<MapRef | null>(null);

  const { register, setValue, watch } = useFormContext();

  // Initialize state with form values
  const [marker, setMarker] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: 0,
    longitude: 0,
  });

  // Sync state with form values on mount
  useEffect(() => {
    const savedLatitude = watch("latitude");
    const savedLongitude = watch("longitude");
    if (savedLatitude !== undefined && savedLongitude !== undefined) {
      setMarker({
        latitude: savedLatitude,
        longitude: savedLongitude,
      });
    }
  }, [watch]);

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMarker((prev) => ({ ...prev, latitude: value }));
      setValue("latitude", value);
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMarker((prev) => ({ ...prev, longitude: value }));
      setValue("longitude", value);
    }
  };

  const onMarkerDrag = useCallback(
    (event: MarkerDragEvent) => {
      const { lng, lat } = event.lngLat;
      setMarker({
        latitude: Math.round(lat * 1000000) / 1000000,
        longitude: Math.round(lng * 1000000) / 1000000,
      });
      setValue("latitude", lat);
      setValue("longitude", lng);
    },
    [setValue],
  );

  const onMapClick = useCallback(
    (event: any) => {
      const { lng, lat } = event.lngLat;
      setMarker({
        latitude: Math.round(lat * 1000000) / 1000000,
        longitude: Math.round(lng * 1000000) / 1000000,
      });
      setValue("latitude", lat);
      setValue("longitude", lng);
    },
    [setValue],
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* Map Section */}
      <div className="flex-grow">
        <Map
          ref={mapRef}
          projection={{ name: "mercator" }}
          initialViewState={{
            latitude: marker.latitude || 51,
            longitude: marker.longitude || 7,
            zoom: 3.5,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
          style={{
            width: "100%",
          }}
          onClick={onMapClick}
        >
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />
          {marker.latitude && marker.longitude && (
            <Marker
              latitude={marker.latitude}
              longitude={marker.longitude}
              anchor="center"
              draggable
              onDrag={onMarkerDrag}
            />
          )}
          <NavigationControl position="top-right" showCompass={false} />
          <GeolocateControl
            position="top-right"
            showAccuracyCircle={true}
            trackUserLocation={true}
          />
        </Map>
      </div>

      {/* Inputs Section */}
      <div className="p-4 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-around">
        <div className="mb-4">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step={"any"}
            {...register("latitude", {
              valueAsNumber: true,
            })}
            value={marker.latitude !== null ? marker.latitude : ""}
            onChange={handleLatitudeChange}
            placeholder="Enter latitude (-90 to 90)"
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step={"any"}
            {...register("longitude", {
              valueAsNumber: true,
            })}
            value={marker.longitude !== null ? marker.longitude : ""}
            onChange={handleLongitudeChange}
            placeholder="Enter longitude (-180 to 180)"
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>
    </div>
  );
}
