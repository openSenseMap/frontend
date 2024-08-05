import { type Sensor } from "~/schema";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { typedjson } from "remix-typedjson";
import { addDays } from "date-fns";
import DeviceDetailBox from "~/components/device-detail/device-detail-box";
import MobileBoxView from "~/components/map/layers/mobile/mobile-box-view";
import { getDevice } from "~/models/device.server";
import { getMeasurement } from "~/models/measurement.server";
import { getGraphColor } from "~/lib/utils";
import {
  getSensorsFromDevice,
  getSensorsWithLastMeasurement,
} from "~/models/sensor.server";
import i18next from "~/i18next.server";
import ErrorMessage from "~/components/error-message";

export async function loader({ params, request }: LoaderFunctionArgs) {
  console.log(`[explore.$deviceId._index.tsx - loader]`);
  const locale = await i18next.getLocale(request);
  // Extracting the selected sensors from the URL query parameters using the stringToArray function
  const url = new URL(request.url);

  if (!params.deviceId) {
    throw new Response("Device not found", { status: 502 });
  }

  const device = await getDevice({ id: params.deviceId });
  const sensors = await getSensorsFromDevice(params.deviceId);

  const sensorsWithLastestMeasurement = await getSensorsWithLastMeasurement(
    params.deviceId,
  );

  // Find all sensors from the device response that have the same id as one of the sensor array value
  const sensorIds = url.searchParams.getAll("sensor");
  const aggregation = url.searchParams.get("aggregation") || "raw";
  const startDate = url.searchParams.get("date_from") || undefined;
  const endDate = url.searchParams.get("date_to") || undefined;
  var sensorsToQuery = sensors.filter((sensor: Sensor) =>
    sensorIds.includes(sensor.id),
  );

  if (!sensorsToQuery) {
    return typedjson({
      device: device,
      selectedSensors: [],
      OSEM_API_URL: process.env.OSEM_API_URL,
      locale: locale,
    });
  }

  const selectedSensors: Sensor[] = await Promise.all(
    sensorsToQuery.map(async (sensor: Sensor) => {
      if (startDate && endDate) {
        const sensorData = await getMeasurement(
          sensor.id,
          aggregation,
          new Date(startDate),
          addDays(new Date(endDate), 1),
        );

        return {
          ...sensor,
          data: sensorData as any,
        };
      } else {
        const sensorData = await getMeasurement(sensor.id, aggregation);
        return {
          ...sensor,
          data: sensorData as any,
        };
      }
    }),
  );

  selectedSensors.map((sensor: any) => {
    const color = getGraphColor(sensor.title);
    sensor.color = color;
    return color;
  });

  // Combine the device data with the selected sensors and return the result as JSON + add env variable
  const data = {
    device: device,
    sensors: sensorsWithLastestMeasurement,
    selectedSensors: selectedSensors,
    aggregation: aggregation,
    fromDate: startDate,
    toDate: endDate,
    OSEM_API_URL: process.env.OSEM_API_URL,
    locale: locale,
  };

  return typedjson(data);
}

// Defining the component that will render the page
export default function DeviceId() {
  // Retrieving the data returned by the loader using the useLoaderData hook
  const data = useLoaderData<typeof loader>();

  if (!data?.device && !data.sensors) {
    return null;
  }

  return (
    <>
      {/* If the box is mobile, iterate over selected sensors and show trajectory */}
      {data.device.exposure === "mobile" ? (
        <MobileBoxView sensors={data.sensors} />
      ) : null}
      <DeviceDetailBox />
    </>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
