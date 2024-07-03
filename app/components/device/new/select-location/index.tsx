import React, { useCallback, useRef, useState } from "react";
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
import { useField } from "remix-validated-form";

export interface SelectLocationProps {
  data: any;
}

//**********************************
export default function SelectLocation({ data }: SelectLocationProps) {
  const { t } = useTranslation("newdevice");
  const mapRef = useRef<MapRef | null>(null);
  const userLocaleString = getUserLocale()?.toString() || "en";

  const latitudeField = useField("latitude");
  const longitudeField = useField("longitude");
  const heightField = useField("height");

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
    data.data.height ? data.data.height : "",
  );

  //* height derivation helper function
  const heightDerivation = useCallback(
    (lng: number, lat: number) => {
      const elevation = mapRef.current?.queryTerrainElevation([lng, lat]);
      setHeight(elevation ? Math.round(elevation * 100) / 100 : "");
      setTimeout(() => heightField.validate(), 0);
    },
    [heightField],
  );

  //* on-marker-drag event
  const onMarkerDrag = useCallback(
    (event: MarkerDragEvent) => {
      // console.log(event);
      setMarker({
        longitude: Math.round(event.lngLat.lng * 1000000) / 1000000,
        latitude: Math.round(event.lngLat.lat * 1000000) / 1000000,
      });
      heightDerivation(event.lngLat.lng, event.lngLat.lat);
    },
    [heightDerivation],
  );

  //* on-geolocate event
  const onGeolocate = useCallback(
    (event: GeolocateResultEvent) => {
      // console.log(event);
      setMarker({
        longitude: Math.round(event.coords.longitude * 1000000) / 1000000,
        latitude: Math.round(event.coords.latitude * 1000000) / 1000000,
      });
      mapRef.current?.on("moveend", () => {
        heightDerivation(event.coords.longitude, event.coords.latitude);
      });
    },
    [heightDerivation],
  );

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
      heightDerivation(
        event.result.geometry.coordinates[0],
        event.result.geometry.coordinates[1],
      );
    });
  };

  //* on-map-click event
  const onClick = (event: MapLayerMouseEvent) => {
    // console.log(event);
    setMarker({
      longitude: Math.round(event.lngLat.lng * 1000000) / 1000000,
      latitude: Math.round(event.lngLat.lat * 1000000) / 1000000,
    });
    heightDerivation(event.lngLat.lng, event.lngLat.lat);
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-dark-text">
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
            <div className="flex">
              <label
                htmlFor="latitude"
                className="txt-base block font-bold tracking-normal"
              >
                {t("latitude")}
              </label>
              {latitudeField.error && (
                <span className="ml-2 text-red-500">{latitudeField.error}</span>
              )}
            </div>

            <div className="mt-1">
              <input
                {...latitudeField.getInputProps({ id: "latitude" })}
                id="latitude"
                // required
                name="latitude"
                type="number"
                min="-90"
                max="90"
                value={marker.latitude}
                onChange={(e) => {
                  if (
                    Number(e.target.value) >= -90 &&
                    Number(e.target.value) <= 90
                  ) {
                    setMarker({
                      latitude: e.target.value,
                      longitude: marker.longitude,
                    });
                    latitudeField.validate();
                  }
                }}
                aria-describedby="name-error"
                className={
                  "w-full rounded border border-gray-200 px-2 py-1 text-base dark:bg-dark-boxes" +
                  (!marker.latitude
                    ? " border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow focus:shadow-[#FF0000] "
                    : "")
                }
              />
            </div>
          </div>

          <div>
            <div className="flex">
              <label
                htmlFor="longitude"
                className="txt-base block font-bold tracking-normal"
              >
                {t("longitude")}
              </label>
              {longitudeField.error && (
                <span className="ml-2 text-red-500">
                  {longitudeField.error}
                </span>
              )}
            </div>

            <div className="mt-1">
              <input
                {...longitudeField.getInputProps({ id: "longitude" })}
                id="longitude"
                // required
                name="longitude"
                type="number"
                min="-180"
                max="180"
                value={marker.longitude}
                onChange={(e) => {
                  if (
                    Number(e.target.value) >= -180 &&
                    Number(e.target.value) <= 180
                  ) {
                    setMarker({
                      latitude: marker.latitude,
                      longitude: e.target.value,
                    });
                    longitudeField.validate();
                  }
                }}
                aria-describedby="name-error"
                className={
                  "w-full rounded border border-gray-200 px-2 py-1 text-base dark:bg-dark-boxes" +
                  (!marker.longitude
                    ? " border-[#FF0000] shadow-[#FF0000] focus:border-[#FF0000] focus:shadow focus:shadow-[#FF0000] "
                    : "")
                }
              />
            </div>
          </div>

          <div>
            <div className="flex">
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
              {heightField.error && (
                <span className="ml-2 text-red-500">{heightField.error}</span>
              )}
            </div>
            <div className="mt-1">
              <input
                {...heightField.getInputProps({ id: "height" })}
                id="height"
                // required
                name="height"
                type="number"
                value={height}
                onChange={(e) => {
                  if (
                    Number(e.target.value) >= -200 &&
                    Number(e.target.value) <= 10000
                  ) {
                    setHeight(e.target.value);
                    heightField.validate();
                  }
                }}
                aria-describedby="name-error"
                className="w-full rounded border border-gray-200 px-2 py-1 text-base dark:bg-dark-boxes"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
