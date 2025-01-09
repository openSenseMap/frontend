import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { addDays } from "date-fns";
import Graph from "~/components/device-detail/graph";
import MobileBoxView from "~/components/map/layers/mobile/mobile-box-view";
import { getDevice } from "~/models/device.server";
import { getMeasurement } from "~/models/measurement.server";
import { getSensor } from "~/models/sensor.server";
import { type Sensor } from "~/schema";

interface SensorWithColor extends Sensor {
  color: string;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { deviceId, sensorId, sensorId2 } = params;

  if (!deviceId) {
    throw new Response("Device not found", { status: 404 });
  }
  if (!sensorId || !sensorId2) {
    throw new Response("Sensor not found", { status: 404 });
  }
  const device = await getDevice({ id: deviceId });

  const url = new URL(request.url);
  const aggregation = url.searchParams.get("aggregation") || "raw";
  const startDate = url.searchParams.get("date_from");
  const endDate = url.searchParams.get("date_to");

  // Fetch sensors
  const sensor1 = (await getSensor(sensorId)) as SensorWithColor;
  const sensor2 = (await getSensor(sensorId2)) as SensorWithColor;

  if (!sensor1 || !sensor2) {
    throw new Response("One or both sensors not found", { status: 404 });
  }

  // Fetch measurements for each sensor
  const sensor1Data = await getMeasurement(
    sensorId,
    aggregation,
    startDate ? new Date(startDate) : undefined,
    endDate ? addDays(new Date(endDate), 1) : undefined,
  );
  const sensor2Data = await getMeasurement(
    sensorId2,
    aggregation,
    startDate ? new Date(startDate) : undefined,
    endDate ? addDays(new Date(endDate), 1) : undefined,
  );

  // Assign data to sensors
  sensor1.data = sensor1Data;
  sensor2.data = sensor2Data;

  // Ensure each sensor has a color
  sensor1.color = sensor1.color || "#8da0cb"; // Default color for sensor 1
  sensor2.color = sensor2.color || "#fc8d62"; // Default color for sensor 2

  return {
    device: device,
    sensors: [sensor1, sensor2],
    startDate,
    endDate,
    aggregation,
  };
}

export default function SensorView() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <>
      <Graph
        aggregation={loaderData.aggregation}
        sensors={loaderData.sensors}
      />
      {loaderData.device.exposure === "mobile" && (
        <MobileBoxView sensors={loaderData.sensors} />
      )}
    </>
  );
}
