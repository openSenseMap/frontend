import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdvancedProps {
  data: any;
}

export default function Advanced({ data }: AdvancedProps) {
  const [mqttEnabled, setMqttEnabled] = useState(data.mqttEnabled);
  const [ttnEnabled, setTtnEnabled] = useState(data.ttnEnabled);
  const [ttnDecodeProfile, setTtnDecodeProfile] = useState(
    data.ttnDecodeProfile ? data.ttnDecodeProfile : ""
  );

  const { t } = useTranslation("newdevice");

  return (
    <div className=" pt-4">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t("advanced")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {t("advanced_text")}
        </p>
      </div>
      <div
        data-disabled={mqttEnabled}
        className="pt-10 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
      >
        <div className="flex text-2xl font-medium">
          <p> TheThingsNetwork - TTN</p>
          {/* {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                          "ttn",
                        ]) ? (
                          <ExclamationCircleIcon className="ml-2 h-6 w-6" />
                        ) : null} */}
        </div>
        <br />
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            <Trans
              t={t}
              i18nKey="ttn_info_text"
              components={[
                <a
                  key="ttn"
                  href="https://www.thethingsnetwork.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-700 hover:underline"
                >
                  placeholder
                </a>,
                <a
                  key="ttn"
                  href="https://github.com/sensebox/ttn-osem-integration"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:blue-green-700 text-blue-500 hover:underline"
                >
                  placeholder
                </a>,
              ]}
            />
          </AlertDescription>
        </Alert>
        <br />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ttnEnabled"
            name="ttnEnabled"
            checked={ttnEnabled}
            onCheckedChange={(checked) => {
              checked === "indeterminate"
                ? setTtnEnabled(undefined)
                : setTtnEnabled(checked);
              // if (checked === false) {
              //   formContext.validateField("mqtt");
              // }
            }}
          />
          <label
            htmlFor="ttnEnabled"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t("enable")} TTN
          </label>
        </div>
        {ttnEnabled ? (
          <div className="mt-6 space-y-6 sm:mt-5 sm:space-y-5">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="ttnAppId"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Application ID
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full">
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm font-thin">
                        {t("ttn_app_id_info")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="text"
                    name="ttnAppId"
                    id=" ttnAppId"
                    required
                    defaultValue={data.ttnAppId}
                    autoComplete="mqttDecodeOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!ttnEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="ttnDeviceId"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Device ID
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full">
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm font-thin">
                        {t("ttn_dev_id_info")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="text"
                    name="ttnDeviceId"
                    id="ttnDeviceId"
                    required
                    defaultValue={data.ttnDeviceId}
                    autoComplete="ttnDeviceId"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!ttnEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="ttnDecodeProfile"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Decoding Profile
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full">
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[310px] text-sm font-thin">
                        <Trans
                          t={t}
                          i18nKey="ttn_decode_profile_info"
                          components={[
                            <a
                              key="ttn_decode_profile_info"
                              href="https://github.com/sensebox/ttn-osem-integration#decoding-profiles"
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-700 hover:underline"
                            >
                              placeholder
                            </a>,
                          ]}
                        />
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <select
                    name="ttnDecodeProfile"
                    id="ttnDecodeProfile"
                    required
                    placeholder="Profile"
                    value={ttnDecodeProfile}
                    onChange={(e) => {
                      setTtnDecodeProfile(e.target.value);
                    }}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!ttnEnabled}
                  >
                    <option value="" disabled selected hidden>
                      Profile...
                    </option>
                    <option value="sensebox/home">senseBox:home</option>
                    <option value="lora-serialization">
                      LoRa Serialization
                    </option>
                    <option value="json">JSON</option>
                    <option value="cayenne-lpp">Cayenne LPP (beta)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="ttnDecodeOptions"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Decoding Options
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full">
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[300px] text-sm font-thin">
                        {t("ttn_decode_options_info")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="text"
                    name="ttnDecodeOptions"
                    id="ttnDecodeOptions"
                    required
                    value={data.ttnDecodeOptions}
                    autoComplete="ttnDecodeOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={
                      !ttnEnabled ||
                      ttnDecodeProfile === "sensebox/home" ||
                      ttnDecodeProfile === "cayenne-lpp" ||
                      ttnDecodeProfile === ""
                    }
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="ttnPort"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Port (optional)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full">
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[300px] text-sm font-thin">
                        {t("ttn_port_info")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="number"
                    name="ttnPort"
                    id="ttnPort"
                    value={data.ttnPort}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!ttnEnabled}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div
        data-disabled={ttnEnabled}
        className="pt-16 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
      >
        <div className="flex text-2xl font-medium">
          <p>MQTT</p>
          {/* {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                          "mqtt",
                        ]) ? (
                          <ExclamationCircleIcon className="ml-2 h-6 w-6" />
                        ) : null} */}
        </div>
        <br />
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            <Trans
              t={t}
              i18nKey="mqtt_info_text"
              components={[
                <a
                  key="mqtt"
                  href="https://mqtt.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-700 hover:underline"
                >
                  placeholder
                </a>,
                <a
                  key="mqtt"
                  href="https://docs.opensensemap.org/#api-Boxes-postNewBox"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:blue-green-700 text-blue-500 hover:underline"
                >
                  placeholder
                </a>,
              ]}
            />
          </AlertDescription>
        </Alert>
        <br />
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={mqttEnabled}
            name="mqttEnabled"
            id="mqttEnabled"
            onCheckedChange={(checked) => {
              checked === "indeterminate"
                ? setMqttEnabled(undefined)
                : setMqttEnabled(checked);
              // if (checked === false) {
              //   formContext.validateField("mqtt");
              // }
            }}
          />
          <label
            htmlFor="mqttEnabled"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Enable MQTT
          </label>
        </div>
        {mqttEnabled ? (
          <div className="mt-6 space-y-6 sm:mt-5 sm:space-y-5">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="mqttUrl"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                URL
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="url"
                    name="mqttUrl"
                    id="name"
                    required
                    defaultValue={data.mqttUrl}
                    autoComplete="mqttUrl"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="mqttTopic"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2 "
              >
                Topic
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="text"
                    name="mqttTopic"
                    id="mqttTopic"
                    required
                    defaultValue={data.mqttTopic}
                    autoComplete="mqttTopic"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <div>
                <label
                  className="text-base font-medium text-gray-900 sm:text-sm sm:text-gray-700"
                  id="label-notifications"
                  htmlFor="mqttFormat"
                >
                  Message format
                </label>
              </div>
              <div className="sm:col-span-2">
                <div className="max-w-lg">
                  <p className="text-sm text-gray-500">
                    The file format your data will be transferred in.
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="format-json"
                        name="mqttFormat"
                        value="json"
                        defaultChecked={data.mqttFormat === "json"}
                        type="radio"
                        required
                        className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed"
                        disabled={!mqttEnabled}
                      />
                      <label
                        htmlFor="format-json"
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        json
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="format-csv"
                        name="mqttFormat"
                        value="csv"
                        defaultChecked={data.mqttFormat === "csv"}
                        type="radio"
                        required
                        className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed"
                        disabled={!mqttEnabled}
                      />
                      <label
                        htmlFor="format-csv"
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        csv
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="mqttDecodeOptions"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Decoding options
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="text"
                    name="mqttDecodeOptions"
                    id="mqttDecodeOptions"
                    required
                    defaultValue={data.mqttDecodeOptions}
                    autoComplete="mqttDecodeOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="mqttConnectOptions"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Connect options
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    type="text"
                    name="mqttConnectOptions"
                    id="mqttConnectOptions"
                    required
                    defaultValue={data.mqttConnectOptions}
                    autoComplete="mqttConnectOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <br />
      </div>
    </div>
  );
}
