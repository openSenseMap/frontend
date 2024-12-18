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
} from "react-map-gl";

export function LocationStep() {
  const mapRef = useRef<MapRef | null>(null);
  const { register, setValue, watch } = useFormContext();

  const savedLatitude = watch("latitude");
  const savedLongitude = watch("longitude");

  const [marker, setMarker] = useState<{
    latitude: number | string;
    longitude: number | string;
  }>({
    latitude: savedLatitude || "",
    longitude: savedLongitude || "",
  });

  useEffect(() => {
    if (savedLatitude !== undefined && savedLongitude !== undefined) {
      setMarker({
        latitude: savedLatitude,
        longitude: savedLongitude,
      });
    }
  }, [savedLatitude, savedLongitude]);

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    const parsedValue = parseFloat(value);

    setMarker((prev) => ({
      ...prev,
      latitude: value === "" || isNaN(parsedValue) ? "" : parsedValue,
    }));

    setValue(
      "latitude",
      value === "" || isNaN(parsedValue) ? undefined : parsedValue,
    );
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    const parsedValue = parseFloat(value);

    setMarker((prev) => ({
      ...prev,
      longitude: value === "" || isNaN(parsedValue) ? "" : parsedValue,
    }));

    setValue(
      "longitude",
      value === "" || isNaN(parsedValue) ? undefined : parsedValue,
    );
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
      <div className="flex-grow">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: marker.latitude ? Number(marker.latitude) : 51,
            longitude: marker.longitude ? Number(marker.longitude) : 7,
            zoom: 3.5,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
          style={{
            width: "100%",
          }}
          onClick={onMapClick}
        >
          {marker.latitude && marker.longitude && (
            <Marker
              latitude={Number(marker.latitude)}
              longitude={Number(marker.longitude)}
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

      <div className="p-4 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-around">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            {...register("latitude", {
              valueAsNumber: true,
              required: "Latitude is required",
              min: -90,
              max: 90,
            })}
            value={marker.latitude === "" ? "" : String(marker.latitude)}
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
            step="any"
            {...register("longitude", {
              valueAsNumber: true,
              required: "Longitude is required",
              min: -180,
              max: 180,
            })}
            value={marker.longitude === "" ? "" : String(marker.longitude)}
            onChange={handleLongitudeChange}
            placeholder="Enter longitude (-180 to 180)"
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>
    </div>
  );
}
