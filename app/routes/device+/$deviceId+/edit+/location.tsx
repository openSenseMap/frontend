import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useOutletContext,
} from "@remix-run/react";
import React, { useCallback, useState } from "react";
import { getUserId } from "~/session.server";
import { Save } from "lucide-react";

import { typedjson } from "remix-typedjson";
import invariant from "tiny-invariant";
import {
  getDeviceWithoutSensors,
  updateDeviceLocation,
} from "~/models/device.server";
import type { MarkerDragEvent } from "react-map-gl";
import { Map, MapProvider, Marker, NavigationControl } from "react-map-gl";
import mapboxgl from "mapbox-gl/dist/mapbox-gl.css?url";
import ErrorMessage from "~/components/error-message";

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.deviceId;

  if (typeof deviceID !== "string") {
    return "deviceID not found";
  }

  const deviceData = await getDeviceWithoutSensors({ id: deviceID });

  return typedjson(deviceData);
}

//*****************************************
//* required to view mapbox proberly (Y.Q.)
export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxgl,
    },
  ];
};

//*****************************************************
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { latitude, longitude } = Object.fromEntries(formData);

  const id = params.deviceId;
  invariant(id, `deviceID not found!`);

  await updateDeviceLocation({
    id: id,
    latitude: Number(latitude),
    longitude: Number(longitude),
  });

  return { isUpdated: true };
}

//**********************************
export default function EditLocation() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  //* map marker
  const [marker, setMarker] = useState({
    latitude: data.latitude,
    longitude: data.longitude,
  });
  //* on-marker-drag event
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    });
  }, []);
  //* to view toast on edit-page
  const [setToastOpen] = useOutletContext<[(_open: boolean) => void]>();

  React.useEffect(() => {
    //* if sensors data were updated successfully
    if (actionData && actionData?.isUpdated) {
      //* show notification when data is successfully updated
      setToastOpen(true);
    }
  }, [actionData, setToastOpen]);

  return (
    <div className="grid grid-rows-1">
      {/* location form */}
      <div className="flex min-h-full items-center justify-center">
        <div className="mx-auto w-full font-helvetica text-[14px]">
          {/* Form */}
          <Form method="post" noValidate>
            {/* Heading */}
            <div>
              {/* Title */}
              <div className="mt-2 flex justify-between">
                <div>
                  <h1 className=" text-4xl">Location</h1>
                </div>
                <div>
                  {/* Save button */}
                  <button
                    name="intent"
                    value="save"
                    disabled={!marker.latitude || !marker.longitude}
                    className="h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6] disabled:cursor-not-allowed disabled:bg-[#e9e9ed]"
                  >
                    <Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
                  </button>
                </div>
              </div>
            </div>

            {/* divider */}
            <hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            {/* Map view */}
            <div className="mt-5">
              <MapProvider>
                <Map
                  initialViewState={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                    zoom: 10,
                  }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
                  style={{
                    width: "100%",
                    height: "500px",
                    borderRadius: "6px",
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
              </MapProvider>
            </div>

            {/* Latitude, Longitude btns */}
            <div className="mx-5 mt-[20px]">
              <div className=" grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="Latitude"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Latitude
                  </label>

                  <div className="mt-1">
                    <input
                      id="latitude"
                      required
                      autoFocus={true}
                      name="latitude"
                      type="number"
                      min="-85.06"
                      max="85.06"
                      value={marker.latitude}
                      onChange={(e) => {
                        if (
                          Number(e.target.value) >= -85.06 &&
                          Number(e.target.value) <= 85.06
                        ) {
                          setMarker({
                            latitude: e.target.value,
                            longitude: marker.longitude,
                          });
                        }
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
                      required
                      autoFocus={true}
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
                        }
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
              </div>

              <button
                onClick={() => {
                  setMarker({
                    latitude: data.latitude,
                    longitude: data.longitude,
                  });
                }}
                className="mb-10 mt-4 font-semibold
                text-[#337ab7]
                hover:text-[#23527c] hover:underline"
              >
                Reset location
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
