import React, { useRef, useState, useCallback } from "react";
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

  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [marker, setMarker] = useState({
    latitude: 51, // Default latitude
    longitude: 10, // Default longitude
  });

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
            latitude: marker.latitude,
            longitude: marker.longitude,
            zoom: 3.5,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
          style={{
            width: "100%",
            // height: "80%",
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
          <Marker
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="center"
            draggable
            onDrag={onMarkerDrag}
          />
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
            {...register("latitude", {
              valueAsNumber: true,
            })}
            value={marker.latitude}
            onChange={handleLatitudeChange}
            placeholder="Enter latitude (-90 to 90)"
            className="w-full p-2 border rounded-md"
          />
          {errors.latitude && (
            <p className="text-sm text-red-600">
              {String(errors.latitude.message)}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            {...register("longitude", {
              valueAsNumber: true,
            })}
            value={marker.longitude}
            onChange={handleLongitudeChange}
            placeholder="Enter longitude (-180 to 180)"
            className="w-full p-2 border rounded-md"
          />
          {errors.longitude && (
            <p className="text-sm text-red-600">
              {String(errors.longitude.message)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
