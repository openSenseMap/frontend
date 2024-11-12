import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { addDays } from "date-fns";
import { typedjson } from "remix-typedjson";
import Graph from "~/components/device-detail/graph";
import { getMeasurement } from "~/models/measurement.server";
import { getSensor } from "~/models/sensor.server";
import { type Sensor } from "~/schema";

interface SensorWithColor extends Sensor {
  color: string;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { deviceId, sensorId } = params;

  if (!deviceId || !sensorId) {
    throw new Response("Device or sensor not found", { status: 404 });
  }

  const url = new URL(request.url);
  const aggregation = url.searchParams.get("aggregation") || "raw";
  const startDate = url.searchParams.get("date_from");
  const endDate = url.searchParams.get("date_to");

  const sensor = (await getSensor(sensorId)) as SensorWithColor;

  // If sensor is not found, handle gracefully
  if (!sensor) {
    throw new Response("Sensor not found", { status: 404 });
  }

  // Fetch measurements
  const sensorData = await getMeasurement(
    sensorId,
    aggregation,
    startDate ? new Date(startDate) : undefined,
    endDate ? addDays(new Date(endDate), 1) : undefined,
  );

  // Assign data to sensor
  sensor.data = sensorData;
  // query parameter color when sensor wiki works again
  sensor.color = sensor.color || "#000000";

  return typedjson({
    sensors: [sensor],
    startDate,
    endDate,
    aggregation,
  });
}

export default function SensorView() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <Graph aggregation={loaderData.aggregation} sensors={loaderData.sensors} />
  );
}
