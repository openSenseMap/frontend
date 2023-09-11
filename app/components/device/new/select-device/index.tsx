import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { useField } from "remix-validated-form";

interface SelectDeviceProps {
  data: any;
}

export default function SelectDevice({ data }: SelectDeviceProps) {
  const [deviceType, setDeviceType] = useState(data.data.type);
  const { t } = useTranslation("newdevice");

  const deviceTypeField = useField("type");

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t("select_device")}
        </h3>
        {deviceTypeField.error && (
          <span className="text-red-500">{deviceTypeField.error}</span>
        )}
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {t("select_device_text")}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {data.devices.map((device: any) => {
          return (
            <Card
              key={device.id}
              data-checked={deviceType === device.slug}
              onClick={() => { setDeviceType(device.slug); deviceTypeField.validate() }}
              className="relative data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
            >
              <CardContent className="flex justify-center pt-2">
                <AspectRatio ratio={4 / 3}>
                  <img
                    src={`${ENV.SENSORWIKI_API_URL}images/upload/${device.image}`}
                    alt={device.slug}
                    className="rounded-md object-cover"
                  />
                </AspectRatio>
              </CardContent>
              <CardFooter className="flex justify-center">
                <CardTitle>{device.slug}</CardTitle>
                {deviceType === device.slug && (
                  <CheckCircleIcon className="absolute bottom-0 right-0 h-8 w-8 text-green-300" />
                )}
              </CardFooter>
            </Card>
          );
        })}

        <Card
          key={4}
          data-checked={deviceType === "own_device"}
          onClick={() => setDeviceType("own_device")}
          className="relative data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
        >
          <CardContent className="flex justify-center pt-2">
            <AspectRatio ratio={4 / 3}>
              {/* <img
                        src="/images/"
                        alt="own:device"
                        className="rounded-md object-cover"
                      /> */}
            </AspectRatio>
          </CardContent>
          <CardFooter className="flex justify-center">
            <CardTitle>{t("own_device")}</CardTitle>
            {deviceType === "own_device" && (
              <CheckCircleIcon className="absolute bottom-0 right-0 h-8 w-8 text-green-300" />
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="mt-4 space-y-4" hidden>
        {data.devices.map((device: any) => {
          return (
            <div key={device.id} className="flex items-center">
              <input
                {...deviceTypeField.getInputProps({
                  id: `type-${device.slug}`,
                })}
                id={`type-${device.slug}`}
                name="type"
                value={device.slug}
                checked={deviceType === device.slug}
                onChange={() => setDeviceType(device.slug)}
                type="radio"
                // required
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
            {...deviceTypeField.getInputProps({ id: `type-own_device` })}
            id="type-own_device"
            name="type"
            value="own_device"
            checked={deviceType === "own_device"}
            onChange={() => setDeviceType("own_device")}
            type="radio"
            // required
            className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
          />
          <label
            htmlFor="type-own_device"
            className="ml-3 block text-sm font-medium text-gray-700"
          >
            {t("own_device")}
          </label>
        </div>
      </div>

      <div className="py-2">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            <Trans
              t={t}
              i18nKey="select_device_info_text"
              components={[
                <a
                  key="add_device_to_sensorwiki"
                  href="https://sensors.wiki/device/add"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-700 hover:underline"
                >
                  placeholder
                </a>,
              ]}
            />
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
