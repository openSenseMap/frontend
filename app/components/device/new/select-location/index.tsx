// import type { LinksFunction } from "@remix-run/node";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Map,
  Marker,
  type MarkerDragEvent,
  NavigationControl,
} from "react-map-gl";
// import { Map } from "~/components/map";

export interface SelectLocationProps {
  data: any;
}

//**********************************
export default function SelectLocation({ data }: SelectLocationProps) {
  //* map marker
  const [marker, setMarker] = useState({
    latitude: data.data.latitude ? data.data.latitude : 51,
    longitude: data.data.longitude ? data.data.longitude : 7.3,
  });
  const [height, setHeight] = useState(data.data.height ? data.data.height : 0);
  const { t } = useTranslation("newdevice");

  //* on-marker-drag event
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    console.log(event);
    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    });
  }, []);

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
          initialViewState={{
            latitude: marker.latitude,
            longitude: marker.longitude,
            zoom: 5,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
          style={{
            width: "100%",
            height: "45vh",
          }}
        >
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            draggable
            onDrag={onMarkerDrag}
          ></Marker>
          <NavigationControl position="top-left" showCompass={false} />
        </Map>
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

        <button
          type="button"
          onClick={() => {
            setMarker({
              latitude: data.data.latitude,
              longitude: data.data.longitude,
            });
            setHeight(data.data.height);
          }}
          className="mb-10 mt-4 font-semibold
                text-[#337ab7] 
                hover:text-[#23527c] hover:underline"
        >
          {t("reset_location")}
        </button>
      </div>
    </div>
  );
}
