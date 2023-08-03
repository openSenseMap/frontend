import type { LinksFunction } from "@remix-run/node";
import { NavBar } from "~/components/nav-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Map, MapProvider, Marker } from "react-map-gl";
import mapboxgl from "mapbox-gl/dist/mapbox-gl.css";
import { Cloudy, Droplets, Thermometer } from "lucide-react";
import { diffFromCreateDate, getMinuteFormattedString } from "~/utils";
import { Badge } from "~/components/ui/badge";
import moment from "moment";

const deviceData = {
  _id: "5b411d0e5dc1ec001b4f11c8",
  createdAt: "2022-03-30T11:25:43.557Z",
  updatedAt: "2023-08-02T17:23:04.749Z",
  name: "Bahnhofstraße",
  state: "active",
  currentLocation: {
    timestamp: "2018-07-07T20:05:34.723Z",
    coordinates: [7.478471, 52.083515, 3.65],
    type: "Point",
  },
  exposure: "outdoor",
  sensors: [
    {
      title: "PM10",
      unit: "µg/m³",
      sensorType: "SDS 011",
      icon: Cloudy,
      _id: "5b411d0e5dc1ec001b4f11cc",
      lastMeasurement: { value: "4.13", createdAt: "2023-08-03T17:10:04.008Z" },
    },
    {
      title: "PM2.5",
      unit: "µg/m³",
      sensorType: "SDS 011",
      icon: Cloudy,
      _id: "5b411d0e5dc1ec001b4f11cb",
      lastMeasurement: { value: "2.10", createdAt: "2023-08-02T17:23:04.736Z" },
    },
    {
      title: "Temperatur",
      unit: "°C",
      sensorType: "DHT22",
      icon: Thermometer,
      _id: "5b411d0e5dc1ec001b4f11ca",
      lastMeasurement: {
        value: "20.80",
        createdAt: "2022-07-12T07:02:41.061Z",
      },
    },
    {
      title: "rel. Luftfeuchte",
      unit: "%",
      sensorType: "DHT22",
      icon: Droplets,
      _id: "5b411d0e5dc1ec001b4f11c9",
      lastMeasurement: {
        value: "99.90",
        createdAt: "2022-07-12T07:02:41.061Z",
      },
    },
  ],
  model: "luftdaten_sds011_dht22",
  description:
    "Mounted at the street side of my house. Traffic: approx. 8.000 vehicles/d",
  image: "5b411d0e5dc1ec001b4f11c8_pblauf.jpg",
  lastMeasurementAt: "2023-08-02T17:23:04.736Z",
  grouptag: [""],
  loc: [
    {
      geometry: {
        timestamp: "2018-07-07T20:05:34.723Z",
        coordinates: [7.478471, 52.083515, 3.65],
        type: "Point",
      },
      type: "Feature",
    },
  ],
};

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

//**********************************
export default function DeviceDashboard() {
  //* map marker
  const marker = {
    longitude: deviceData.currentLocation.coordinates[0],
    latitude: deviceData.currentLocation.coordinates[1],
  };

  return (
    <div className="space-y-6 px-10 pb-16 tracking-wide ">
      <NavBar />

      {/* Left side - device info */}
      <div className="grid h-[85vh] grid-cols-1 gap-x-4 md:grid-cols-4">
        <Card className="col-span-1">
          <CardHeader className="space-y-0 p-4 pb-0">
            <CardTitle className="text-[18px]">{deviceData.name}</CardTitle>
            <CardDescription>{deviceData._id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* properties */}
            <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-semibold tracking-wider">
              <Badge variant="outline" className="rounded-sm">
                {deviceData.exposure.toUpperCase()}
              </Badge>

              <Badge
                variant="outline"
                className="rounded-sm"
              >{`${deviceData.sensors.length} SENSOR(S)`}</Badge>

              <Badge variant="outline" className="rounded-sm">
                {/* Created {deviceData.createdAt.slice(0, 10)} */}
                {diffFromCreateDate(deviceData.createdAt)}
              </Badge>

              {moment().diff(moment(deviceData.updatedAt), "days") > 3 ? (
                <Badge
                  variant="outline"
                  className="rounded-sm border-[#343e34] bg-[#343e34] text-[#fff]"
                >
                  INACTIVE
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={
                    "rounded-sm border-[#4eaf47] bg-[#4eaf47] text-[#fff]"
                  }
                >
                  ACTIVE
                </Badge>
              )}
            </div>

            {/* image */}
            <div className="rounded-md border p-1">
              <div className="overflow-hidden rounded">
                <img
                  src={
                    "https://opensensemap.org/userimages/5b411d0e5dc1ec001b4f11c8_pblauf.jpg"
                  }
                  alt={"name"}
                  width={250}
                  height={330}
                  className="h-auto w-auto object-cover transition-all hover:scale-105"
                />
              </div>
              <p className="pt-1 text-xs">
                Mounted at the street side of my house. Traffic: approx. 8.000
                vehicles/d
              </p>
            </div>

            {/* Map view */}
            <div className="block">
              <MapProvider>
                <Map
                  initialViewState={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                    zoom: 14,
                  }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={ENV.MAPBOX_ACCESS_TOKEN}
                  style={{
                    width: "100%",
                    height: "200px",
                    borderRadius: "6px",
                  }}
                >
                  <Marker
                    longitude={marker.longitude}
                    latitude={marker.latitude}
                  ></Marker>
                </Map>
              </MapProvider>
            </div>
          </CardContent>
        </Card>

        {/* Right side - measurements */}
        <Card className="col-span-3 ">
          <CardContent>
            <div className="mt-4 flex flex-wrap gap-3">
              {deviceData.sensors.map((sensor: any) => (
                <Card className=" rounded-3xl">
                  <CardHeader>
                    <CardTitle className="mb-2">
                      <sensor.icon className=" h-5.5 w-5.5 mr-2 inline align-bottom" />
                      {sensor.lastMeasurement.value} {sensor.unit}
                    </CardTitle>
                    <CardDescription>
                      <span className=" align-bottom text-[18px] text-[#000]">
                        {sensor.title}{" "}
                      </span>
                      <span className="rounded border px-[2px] py-[1px] text-xs ">
                        {sensor.sensorType}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="m-0 p-0">
                    <hr className="h-px w-full border-0 bg-[#dcdada] dark:bg-gray-700" />
                    {/* <p className="py-2 px-6 text-[#fa5252] text-xs">5 minutes ago</p> */}
                    {sensor.lastMeasurement?.createdAt === undefined ||
                    moment().diff(
                      moment(sensor.lastMeasurement.createdAt),
                      "hours"
                    ) > 25 ? (
                      <p className="px-6 py-2 text-xs text-[#fa5252]">
                        INACTIVE
                      </p>
                    ) : (
                      <p className="px-6 py-2 text-xs text-[#fa5252]">
                        {getMinuteFormattedString(
                          sensor.lastMeasurement.createdAt
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
