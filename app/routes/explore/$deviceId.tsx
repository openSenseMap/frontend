import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BottomBar from "~/components/bottomBar/BottomBar";

export function loader({ params }: LoaderArgs) {
  // do request to API with deviceID
  // const data = await requestToAPI(params.deviceId);
  const data = {
    _id: "5e1f5c5ab459b2001ef314be",
    createdAt: "2022-03-30T11:25:43.809Z",
    updatedAt: "2023-02-15T21:04:50.605Z",
    name: "React.js",
    currentLocation: {
      type: "Point",
      coordinates: [20.409046, 44.779337, 100],
      timestamp: "2020-01-15T19:02:26.183Z",
    },
    exposure: "outdoor",
    sensors: [
      {
        title: "PM10",
        unit: "µg/m³",
        sensorType: "SDS 011",
        icon: "osem-cloud",
        _id: "5e1f5c5ab459b2001ef314c2",
        lastMeasurement: {
          value: "106.90",
          createdAt: "2023-02-15T21:04:50.596Z",
        },
      },
      {
        title: "PM2.5",
        unit: "µg/m³",
        sensorType: "SDS 011",
        icon: "osem-cloud",
        _id: "5e1f5c5ab459b2001ef314c1",
        lastMeasurement: {
          value: "59.80",
          createdAt: "2023-02-15T21:04:50.596Z",
        },
      },
      {
        title: "Temperatur",
        unit: "°C",
        sensorType: "DHT22",
        icon: "osem-thermometer",
        _id: "5e1f5c5ab459b2001ef314c0",
        lastMeasurement: {
          value: "6.70",
          createdAt: "2023-02-15T21:04:50.596Z",
        },
      },
      {
        title: "rel. Luftfeuchte",
        unit: "%",
        sensorType: "DHT22",
        icon: "osem-humidity",
        _id: "5e1f5c5ab459b2001ef314bf",
        lastMeasurement: {
          value: "99.90",
          createdAt: "2023-02-15T21:04:50.596Z",
        },
      },
    ],
    model: "luftdaten_sds011_dht22",
    grouptag: ["Luftdaten"],
    lastMeasurementAt: "2023-02-15T21:04:50.596Z",
    loc: [
      {
        geometry: {
          type: "Point",
          coordinates: [20.409046, 44.779337, 100],
          timestamp: "2020-01-15T19:02:26.183Z",
        },
        type: "Feature",
      },
    ],
  };
  return json(data);
}

export default function DeviceId() {
  const data = useLoaderData<typeof loader>();
  return <BottomBar id={data._id} name={data.name} sensors={data.sensors} lastUpdate={data.updatedAt}/>;
}
