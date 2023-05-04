// Importing dependencies
import type { Sensor } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { useCatch, useLoaderData } from "@remix-run/react";
import { typedjson } from "remix-typedjson";
import BottomBar from "~/components/bottomBar/BottomBar";
import { getDevice, getMeasurements } from "~/models/device.server";

export async function loader({ params, request }: LoaderArgs) {
  // Extracting the selected sensors from the URL query parameters using the stringToArray function
  const url = new URL(request.url);

  if (params.deviceId) {
    const device = await getDevice({ id: params.deviceId });

    // Find all sensors from the device response that have the same id as one of the sensor array value
    const sensorIds = url.searchParams.getAll("sensor");
    var sensorsToQuery = device?.sensors.filter((sensor: Sensor) =>
      sensorIds.includes(sensor.id)
    );

    const selectedSensors: Sensor[] = [];
    if (sensorsToQuery && sensorsToQuery.length > 0) {
      await Promise.all(
        sensorsToQuery.map(async (sensor: Sensor) => {
          const sensorData = await getMeasurements(
            params.deviceId,
            sensor.id,
            new Date(new Date().getTime() - 24 * 60 * 60 * 1000), //24 hours ago
            new Date()
          );
          const sensorToAdd = {
            ...sensor,
            data: sensorData,
          };
          selectedSensors.push(sensorToAdd);
        })
      );
    }

    // Combine the device data with the selected sensors and return the result as JSON + add env variable
    const data = {
      device: device,
      selectedSensors: selectedSensors,
      OSEM_API_URL: process.env.OSEM_API_URL,
    };
    return typedjson(data);
  } else {
    throw new Response("Device not found", { status: 502 });
  }
}

// Defining the component that will render the page
export default function DeviceId() {
  // Retrieving the data returned by the loader using the useLoaderData hook
  const data = useLoaderData<typeof loader>();

  // Rendering the BottomBar component with the device data
  return data?.device && data.selectedSensors ? (
    <BottomBar device={data.device} selectedSensors={data.selectedSensors} />
  ) : null;
}

// Defining a CatchBoundary component to handle errors thrown by the loader
export function CatchBoundary() {
  // Retrieving the error thrown by the loader using the useCatch hook
  const caught = useCatch();

  // If the error has a status code of 502, render an error message
  if (caught.status === 502) {
    return (
      <div className="absolute bottom-0 z-10 w-full">
        <div className="flex animate-fade-in-up items-center justify-center bg-white py-10">
          <div className="text-red-500">
            Oh no, we could not find this Device ID. Are you sure it exists?
          </div>
        </div>
      </div>
    );
  }

  // If the error has a different status code, throw a new error with the status code included in the message
  throw new Error(`Unsupported thrown response status code: ${caught.status}`);
}
