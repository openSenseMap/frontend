import mapboxgl from "mapbox-gl/dist/mapbox-gl.css?url";
import moment from "moment";
import { Map, MapProvider, Marker } from "react-map-gl";
import  { type LinksFunction } from "react-router";
import { NavBar } from "~/components/nav-bar";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { diffFromCreateDate, getMinuteFormattedString } from "~/utils.server";

let deviceData = {
  _id: "5b411d0e5dc1ec001b4f11c8",
  createdAt: "2022-03-30T11:25:43.557Z",
  updatedAt: "2023-10-26T06:28:23.033Z",
  name: "Bahnhofstraße",
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
      icon: "osem-cloud",
      _id: "5b411d0e5dc1ec001b4f11cc",
      lastMeasurement: {
        value: "23.73",
        createdAt: "2023-10-13T06:28:23.027Z",
      },
    },
    {
      title: "PM2.5",
      unit: "µg/m³",
      sensorType: "SDS 011",
      icon: "osem-cloud",
      _id: "5b411d0e5dc1ec001b4f11cb",
      lastMeasurement: {
        value: "20.43",
        createdAt: "2023-10-13T06:28:23.027Z",
      },
    },
    {
      title: "Temperatur",
      unit: "°C",
      sensorType: "DHT22",
      icon: "osem-thermometer",
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
      icon: "osem-humidity",
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
  lastMeasurementAt: "2023-10-13T06:28:23.027Z",
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
      <div className="grid grid-cols-4 h-[85vh] gap-x-4">
        <Card className="col-span-1 dark:bg-black dark:border-[#ffffff]">
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
                  className="rounded-sm bg-red-500 text-white "
                >
                  INACTIVE
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={
                    "rounded-sm border-[#4eaf47] bg-[#4eaf47] text-white"
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
        <Card className="col-span-3 dark:bg-black dark:border-[#ffffff] ">
          <CardContent>
            <div className="mt-4 flex flex-wrap gap-3">
              {deviceData.sensors.map((sensor: any) => (
                <Card key={sensor._id} className=" rounded-3xl dark:bg-black dark:border-[#ffffff]">
                  <CardHeader>
                    <CardTitle className="mb-2">
                      <sensor.icon className=" h-5.5 w-5.5 mr-2 inline align-bottom" />
                      {sensor.lastMeasurement.value} {sensor.unit}
                    </CardTitle>
                    <CardDescription>
                      <span className=" align-bottom text-[18px] ">
                        {sensor.title}{" "}
                      </span>
                      <span className="rounded border px-[2px] py-[1px] text-xs">
                        {sensor.sensorType}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="m-0 p-0">
                    <hr className="h-px w-full border-0  bg-[#dcdada] dark:bg-gray-700 dark:border-[#ffffff]" />
                    {/* <p className="py-2 px-6 text-[#fa5252] text-xs">5 minutes ago</p> */}
                    {sensor.lastMeasurement?.createdAt === undefined ||
                    moment().diff(
                      moment(sensor.lastMeasurement.createdAt),
                      "hours",
                    ) > 25 ? (
                      <p className="px-6 py-2 text-xs text-[#fa5252]">
                        INACTIVE
                      </p>
                    ) : (
                      <p className="px-6 py-2 text-xs text-[#fa5252]">
                        {getMinuteFormattedString(
                          sensor.lastMeasurement.createdAt,
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
