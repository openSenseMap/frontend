// Importing dependencies
import { Exposure, type Sensor } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import {
  //isRouteErrorResponse,
  useLoaderData,
  //useRouteError,
} from "@remix-run/react";
import { typedjson } from "remix-typedjson";
import DeviceDetailBox from "~/components/device-detail/device-detail-box";
import MobileBoxView from "~/components/map/layers/mobile/mobile-box-view";
import { getDevice } from "~/models/device.server";
import { getMeasurement } from "~/models/measurement.server";
import { getGraphColor } from "~/lib/utils";
import { getSensors } from "~/models/sensor.server";
import i18next from "~/i18next.server";
import { addDays } from "date-fns";
import { GeneralErrorBoundary } from "~/components/error-boundary";

export async function loader({ params, request }: LoaderArgs) {
  const locale = await i18next.getLocale(request);
  // Extracting the selected sensors from the URL query parameters using the stringToArray function
  const url = new URL(request.url);

  if (!params.deviceId) {
    throw new Response("Device not found", { status: 502 });
  }

  const device = await getDevice({ id: params.deviceId });
  const sensors = await getSensors(params.deviceId);

  // Find all sensors from the device response that have the same id as one of the sensor array value
  const sensorIds = url.searchParams.getAll("sensor");
  const aggregation = url.searchParams.get("aggregation") || "raw";
  const startDate = url.searchParams.get("date_from") || undefined;
  const endDate = url.searchParams.get("date_to") || undefined;
  var sensorsToQuery = sensors.filter((sensor: Sensor) =>
    sensorIds.includes(sensor.id)
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
          addDays(new Date(endDate), 1)
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
    })
  );
  selectedSensors.map((sensor: any) => {
    const color = getGraphColor(sensor.title);
    sensor.color = color;
    return color;
  });
  // Combine the device data with the selected sensors and return the result as JSON + add env variable
  const data = {
    device: device,
    sensors: sensors,
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

  if (!data?.device && !data.selectedSensors) {
    return null;
  }

  return (
    <>
      {/* If the box is mobile, iterate over selected sensors and show trajectory */}
      {data.device.exposure === Exposure.MOBILE ? (
        <MobileBoxView sensors={data.selectedSensors} />
      ) : null}
      <DeviceDetailBox />
    </>
  );
}

export function ErrorBoundary() {
  //const error = useRouteError();

  return (
    <div className="absolute bottom-6 left-4 right-4 top-14 z-40 flex flex-row px-4 py-2 md:bottom-[30px] md:left-[10px] md:top-auto md:max-h-[calc(100vh-8rem)] md:w-1/3 md:p-0">
      <div
        id="deviceDetailBox"
        className={
          "shadow-zinc-800/5 ring-zinc-900/5 relative float-left flex h-full max-h-[calc(100vh-4rem)] w-auto flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 md:max-h-[calc(100vh-8rem)]"
        }
      >
        <GeneralErrorBoundary />
      </div>
    </div>
  );
}
