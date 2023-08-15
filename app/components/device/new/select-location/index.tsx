import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Map,
  type MapLayerMouseEvent,
  type MapRef,
  Marker,
  type MarkerDragEvent,
  NavigationControl,
  GeolocateControl,
  type GeolocateResultEvent,
  Source,
} from "react-map-gl";

import GeocoderControl from "~/components/map/geocoder-control";
import { InfoIcon } from "lucide-react";
import getUserLocale from "get-user-locale";

export interface SelectLocationProps {
  data: any;
}

//**********************************
export default function SelectLocation({ data }: SelectLocationProps) {
  const { t } = useTranslation("newdevice");
  const mapRef = useRef<MapRef | null>(null);
  const userLocaleString = getUserLocale()?.toString() || "en";

  //* map view
  const [viewState, setViewState] = React.useState({
    latitude: data.data.latitude ? data.data.latitude : 51,
    longitude: data.data.longitude ? data.data.longitude : 10,
    zoom: 3.5,
  });

  //* map marker
  const [marker, setMarker] = useState({
    latitude: data.data.latitude ? data.data.latitude : "",
    longitude: data.data.longitude ? data.data.longitude : "",
  });

  //* location height
  const [height, setHeight] = useState(
    data.data.height ? data.data.height : ""
  );

  //* on-marker-drag event
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    // console.log(event);
    setMarker({
      longitude: Math.round(event.lngLat.lng * 1000000) / 1000000,
      latitude: Math.round(event.lngLat.lat * 1000000) / 1000000,
    });
  }, []);

  //* on-geolocate event
  const onGeolocate = useCallback((event: GeolocateResultEvent) => {
    // console.log(event);
    setMarker({
      longitude: Math.round(event.coords.longitude * 1000000) / 1000000,
      latitude: Math.round(event.coords.latitude * 1000000) / 1000000,
    });
    mapRef.current?.on("moveend", () => {
      const elevation = mapRef.current?.queryTerrainElevation([
        event.coords.longitude,
        event.coords.latitude,
      ]);
      setHeight(elevation ? Math.round(elevation * 100) / 100 : "");
    });
  }, []);

  //* on-geocoder-result event
  const onResult = (event: any) => {
    // console.log(event);
    setMarker({
      longitude:
        Math.round(event.result.geometry.coordinates[0] * 1000000) / 1000000,
      latitude:
        Math.round(event.result.geometry.coordinates[1] * 1000000) / 1000000,
    });
    mapRef.current?.on("moveend", () => {
      const elevation = mapRef.current?.queryTerrainElevation([
        event.result.geometry.coordinates[0],
        event.result.geometry.coordinates[1],
      ]);
      setHeight(elevation ? Math.round(elevation * 100) / 100 : "");
    });
  };

  //* on-map-click event
  const onClick = (event: MapLayerMouseEvent) => {
    // console.log(event);
    setMarker({
      longitude: Math.round(event.lngLat.lng * 1000000) / 1000000,
      latitude: Math.round(event.lngLat.lat * 1000000) / 1000000,
    });
  };

  //* derive elevation on-marker change
  useEffect(() => {
    const elevation = mapRef.current?.queryTerrainElevation([
      marker.longitude,
      marker.latitude,
    ]);
    setHeight(elevation ? Math.round(elevation * 100) / 100 : "");
  }, [marker]);

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t("location")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {t("location_text")}
        </p>
      </div>

      {/* Map view */}
      <div className="sm:items-start sm:gap-4 sm:border-gray-200 sm:pt-2">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={onClick}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
          style={{
            width: "100%",
            height: "55vh",
          }}
          terrain={{
            source: "mapbox-dem",
          }}
        >
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />
          {marker.latitude ? (
            <Marker
              longitude={marker.longitude}
              latitude={marker.latitude}
              anchor="center"
              draggable
              onDrag={onMarkerDrag}
            />
          ) : null}
          <NavigationControl position="top-left" showCompass={false} />
          <GeocoderControl
            mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
            position="top-right"
            marker={false}
            onResult={onResult}
            placeholder={t("search_placeholder").toString()}
            language={userLocaleString}
          />
          <GeolocateControl
            onGeolocate={onGeolocate}
            showAccuracyCircle={true}
            position="top-right"
            positionOptions={{ enableHighAccuracy: true }}
          />
        </Map>
      </div>

      {/* Latitude, Longitude */}
      <div>
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <div>
            <label
              htmlFor="latitude"
              className="txt-base block font-bold tracking-normal"
            >
              {t("latitude")}
            </label>

            <div className="mt-1">
              <input
                id="latitude"
                required
                name="latitude"
                type="number"
                value={marker.latitude}
                onChange={(e) => {
                  setMarker({
                    latitude: e.target.value,
                    longitude: marker.longitude,
                  });
                }}
                aria-describedby="name-error"
                className={
                  "w-full rounded border border-gray-200 px-2 py-1 text-base" +
                  (!marker.latitude
                    ? " border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow focus:shadow-[#FF0000] "
                    : "")
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="longitude"
              className="txt-base block font-bold tracking-normal"
            >
              {t("longitude")}
            </label>

            <div className="mt-1">
              <input
                id="longitude"
                required
                name="longitude"
                type="number"
                value={marker.longitude}
                onChange={(e) => {
                  setMarker({
                    latitude: marker.latitude,
                    longitude: e.target.value,
                  });
                }}
                aria-describedby="name-error"
                className={
                  "w-full rounded border border-gray-200 px-2 py-1 text-base" +
                  (!marker.longitude
                    ? " border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow focus:shadow-[#FF0000] "
                    : "")
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="height"
              className="txt-base block font-bold tracking-normal"
            >
              {t("height")}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="h-full">
                    <InfoIcon className="ml-2 h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[300px] text-justify text-sm font-thin">
                      {t("height_info_text")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>

            <div className="mt-1">
              <input
                id="height"
                required
                name="height"
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                }}
                aria-describedby="name-error"
                className="w-full rounded border border-gray-200 px-2 py-1 text-base"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
