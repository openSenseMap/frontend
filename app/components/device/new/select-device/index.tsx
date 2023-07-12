import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";

interface SelectDeviceProps {
  data: any;
}

export default function SelectDevice({ data }: SelectDeviceProps) {
  const [deviceType, setDeviceType] = useState(data.data.type);

  return (
    <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Select Device
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Which hardware do you use?
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {data.devices.map((device: any) => {
          return (
            <Card
              key={device.id}
              data-checked={deviceType === device.slug}
              onClick={() => setDeviceType(device.slug)}
              className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
            >
              <CardContent className="flex justify-center pt-2">
                <AspectRatio ratio={3 / 4}>
                  <img
                    src={`${ENV.SENSORWIKI_API_URL}images/upload/${device.image}`}
                    alt={device.slug}
                    className="rounded-md object-cover"
                  />
                </AspectRatio>
              </CardContent>
              <CardFooter className="flex justify-center">
                <CardTitle>{device.slug}</CardTitle>
              </CardFooter>
            </Card>
          );
        })}

        <Card
          key={4}
          data-checked={deviceType === "own_device"}
          onClick={() => setDeviceType("own_device")}
          className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
        >
          <CardContent className="flex justify-center pt-2">
            <AspectRatio ratio={3 / 4}>
              {/* <img
                        src="/images/"
                        alt="own:device"
                        className="rounded-md object-cover"
                      /> */}
            </AspectRatio>
          </CardContent>
          <CardFooter className="flex justify-center">
            <CardTitle>own_device</CardTitle>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-4 space-y-4" hidden>
        {data.devices.map((device: any) => {
          return (
            <div key={device.id} className="flex items-center">
              <input
                id={`type-${device.slug}`}
                name="type"
                value={device.slug}
                defaultChecked={deviceType === device.slug}
                checked={deviceType === device.slug}
                onChange={() => setDeviceType(device.slug)}
                type="radio"
                required
                className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
              />
              <label
                htmlFor={`type-${device.slug}`}
                className="ml-3 block text-sm font-medium text-gray-700"
              >
                {device.slug}
              </label>
            </div>
          );
        })}

        <div key={4} className="flex items-center">
          <input
            id="type-own_device"
            name="type"
            value="own_device"
            defaultChecked={deviceType === "own_device"}
            checked={deviceType === "own_device"}
            onChange={() => setDeviceType("own_device")}
            type="radio"
            required
            className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
          />
          <label
            htmlFor="type-own_device"
            className="ml-3 block text-sm font-medium text-gray-700"
          >
            own_device
          </label>
        </div>
      </div>

      <div className="py-2">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Dein Gerät is nicht in der Liste? Füge es im Sensor-Wiki hinzu, um
            es auf der openSenseMap zu benutzen: Anleitung
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
