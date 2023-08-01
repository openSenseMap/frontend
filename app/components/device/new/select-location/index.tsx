// import type { LinksFunction } from "@remix-run/node";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPinIcon } from "@heroicons/react/24/outline";

import {
  Map,
  Marker,
  type MarkerDragEvent,
  NavigationControl,
  GeolocateControl,
  type MapRef,
  Source,
  type GeolocateResultEvent,
} from "react-map-gl";
import { Button } from "~/components/ui/button";
// import { Map } from "~/components/map";

export interface SelectLocationProps {
  data: any;
}

//**********************************
export default function SelectLocation({ data }: SelectLocationProps) {
  const mapRef = useRef<MapRef | null>(null);  

  //* map view
  const [viewState, setViewState] = React.useState({
    longitude: 10,
    latitude: 51,
    zoom: 3.5,
  });

  //* map marker
  const [marker, setMarker] = useState({
    latitude: data.data.latitude ? data.data.latitude : 51,
    longitude: data.data.longitude ? data.data.longitude : 10,
  });
  
  const [height, setHeight] = useState(data.data.height ? data.data.height : 339.71);
  const { t } = useTranslation("newdevice");

  //* on-marker-drag event
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    console.log(event);
    setMarker({
      longitude: Math.round(event.lngLat.lng*1000000)/1000000,
      latitude: Math.round(event.lngLat.lat*1000000)/1000000,
    });
  }, []);

  //* on-geolocate event
  const onGeolocate = useCallback((event: GeolocateResultEvent) => {
    console.log(event);
    setMarker({
      longitude: Math.round(event.coords.longitude*1000000)/1000000,
      latitude: Math.round(event.coords.latitude*1000000)/1000000,
    });
  }, []);

  //* derive elevation on-marker change
  useEffect(() => {
    const elevation = mapRef.current?.queryTerrainElevation([marker.longitude, marker.latitude])
    setHeight(elevation ? Math.round(elevation*100)/100 : 0);
  }, [marker]);

  return (
    <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t("location")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {t("location_text")}
        </p>
      </div>

      {/* Map view */}
      <div className="sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
          style={{
            width: "100%",
            height: "45vh",
          }}
          terrain={{
            source: "mapbox-dem"
          }}
        >
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="center"
            draggable
            onDrag={onMarkerDrag}
          ></Marker>
          <NavigationControl position="top-left" showCompass={false} />
          <GeolocateControl onGeolocate={onGeolocate}/>
        </Map>
      </div>

      <div className="flex justify-between sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setMarker({
              latitude: data.data.latitude ? data.data.latitude : 51,
              longitude: data.data.longitude ? data.data.longitude : 10,
            });
            setViewState({
              latitude: data.data.latitude ? data.data.latitude : 51,
              longitude: data.data.longitude ? data.data.longitude : 10,
              zoom: 3.5,
            });
            setHeight(data.data.height);
          }}
          className="bg-red-500 hover:bg-red-700"
        >
          {t("reset_location")}
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={() => {
            setMarker({
              latitude: viewState.latitude,
              longitude: viewState.longitude,
            });
            setHeight(data.data.height);
          }}
          className="bg-blue-500 hover:bg-blue-700"
        >
          <MapPinIcon className="mr-2 h-4 w-4" />
          Set marker location to current map center
        </Button>
      </div>

      {/* Latitude, Longitude btns */}
      <div>
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <div>
            <label
              htmlFor="latitude"
              className="txt-base block font-bold tracking-normal"
            >
              Latitude
            </label>

            <div className="mt-1">
              <input
                id="latitude"
                // required
                autoFocus={true}
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
              Longitude
            </label>

            <div className="mt-1">
              <input
                id="longitude"
                autoFocus={true}
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
            </label>

            <div className="mt-1">
              <input
                id="height"
                required
                autoFocus={true}
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
