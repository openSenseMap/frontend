// Importing dependencies
import { json, LoaderArgs } from "@remix-run/node";
import { useCatch, useLoaderData } from "@remix-run/react";
import BottomBar from "~/components/bottomBar/BottomBar";

export async function loader({ params, request }: LoaderArgs) {
  // Extracting the selected sensors from the URL query parameters using the stringToArray function
  const url = new URL(request.url);

  // Making a request to the OSEM API to fetch the device data using the device ID from the URL parameters
  const response = await fetch(
    process.env.OSEM_API_URL + "/boxes/" + params.deviceId
  );
  const device = await response.json();

  // If the API returns an "UnprocessableEntity" error, throw a new error with a 502 status code
  if (device.code === "UnprocessableEntity") {
    throw new Response("Device not found", { status: 502 });
  }

  // Find all sensors from the device response that have the same id as one of the sensor array value
  const sensorIds = stringToArray(url.searchParams.get("sensors"));
  const selectedSensors = device.sensors.filter((sensor: any) =>
    sensorIds.includes(sensor._id)
  );

  // Combine the device data with the selected sensors and return the result as JSON
  const data = {
    ...device,
    selectedSensors: selectedSensors,
  };
  return json(data);
}

// Defining a function that converts a string of comma-separated values to an array of strings
function stringToArray(str: string | null): string[] {
  // If the string is null or empty, return an empty array
  if (!str) {
    return [];
  }
  // Split the string by comma and remove any leading/trailing whitespace from each value
  return str.split(",").map((val) => val.trim());
}

// Defining the component that will render the page
export default function DeviceId() {
  // Retrieving the data returned by the loader using the useLoaderData hook
  const data = useLoaderData<typeof loader>();

  // Rendering the BottomBar component with the device data
  return (
    <BottomBar
      id={data._id}
      name={data.name}
      sensors={data.sensors}
      lastUpdate={data.updatedAt}
      location={data.currentLocation.coordinates}
      selectedSensors={data.selectedSensors}
    />
  );
}

// Defining a CatchBoundary component to handle errors thrown by the loader
export function CatchBoundary() {
  // Retrieving the error thrown by the loader using the useCatch hook
  const caught = useCatch();

  // If the error has a status code of 502, render an error message
  if (caught.status === 502) {
    return (
      <div>
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
