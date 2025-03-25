import { addDays } from "date-fns";
import { redirect, type LoaderFunctionArgs, useLoaderData  } from "react-router";
import Graph from "~/components/device-detail/graph";
import MobileBoxView from "~/components/map/layers/mobile/mobile-box-view";
import { getDevice } from "~/models/device.server";
import { getMeasurement } from "~/models/measurement.server";
import { getSensor } from "~/models/sensor.server";
import  { type SensorWithMeasurementData } from "~/schema";

interface SensorWithColor extends SensorWithMeasurementData {
  color: string;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { deviceId, sensorId } = params;
  const sensorId2 = params["*"];

  if (!deviceId) {
    return redirect("/explore");
  }

  const device = await getDevice({ id: deviceId });

  if (!device) {
    return redirect("/explore");
  }

  const url = new URL(request.url);
  const aggregation = url.searchParams.get("aggregation") || "raw";
  const startDate = url.searchParams.get("date_from");
  const endDate = url.searchParams.get("date_to");

  if (!sensorId) {
    throw new Response("Sensor 1 not found", { status: 404 });
  }

  const sensor1 = (await getSensor(sensorId)) as SensorWithColor;
  const sensor1Data = await getMeasurement(
    sensorId,
    aggregation,
    startDate ? new Date(startDate) : undefined,
    endDate ? addDays(new Date(endDate), 1) : undefined,
  );

  sensor1.data = sensor1Data;
  sensor1.color = sensor1.color || "#8da0cb";

  let sensor2: SensorWithColor | null = null;

  if (sensorId2) {
    sensor2 = (await getSensor(sensorId2)) as SensorWithColor;
    const sensor2Data = await getMeasurement(
      sensorId2,
      aggregation,
      startDate ? new Date(startDate) : undefined,
      endDate ? addDays(new Date(endDate), 1) : undefined,
    );

    sensor2.data = sensor2Data;
    sensor2.color = sensor2.color || "#fc8d62";
  }

  return {
    device,
    sensors: sensor2 ? [sensor1, sensor2] : [sensor1],
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
      {loaderData.device?.exposure === "mobile" && (
        <MobileBoxView sensors={loaderData.sensors} />
      )}
    </>
  );
}
