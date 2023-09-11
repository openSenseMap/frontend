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
import { useField } from "remix-validated-form";

interface AdvancedProps {
  data: any;
}

export default function Advanced({ data }: AdvancedProps) {
  const { t } = useTranslation("newdevice");

  // ttn form fields
  const [ttnEnabled, setTtnEnabled] = useState<boolean | undefined>(
    data["ttn.enabled"] === "on"
  );
  const ttnAppIdField = useField("ttn.appId");
  const ttnDeviceIdField = useField("ttn.devId");
  const ttnDecodeProfileField = useField("ttn.decodeProfile");
  const [ttnDecodeProfile, setTtnDecodeProfile] = useState<string | undefined>(
    data["ttn.decodeProfile"] ? data["ttn.decodeProfile"] : undefined
  );
  const ttnDecodeOptionsField = useField("ttn.decodeOptions");
  const ttnPortField = useField("ttn.port");

  // mqtt form fields
  const [mqttEnabled, setMqttEnabled] = useState<boolean | undefined>(
    data.mqttEnabled === "on"
  );
  const mqttUrlField = useField("mqtt.url");
  const mqttTopicField = useField("mqtt.topic");
  const mqttFormatField = useField("mqtt.messageFormat");
  const mqttDecodeOptionsField = useField("mqtt.decodeOptions");
  const mqttConnectOptionsField = useField("mqtt.connectOptions");

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
            name="ttn.enabled"
            checked={ttnEnabled}
            onCheckedChange={(checked) => {
              checked === "indeterminate"
                ? setTtnEnabled(undefined)
                : setTtnEnabled(checked);
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
          <div className="mt-6 sm:mt-5">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="ttnAppId"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Application ID
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
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
                    {...ttnAppIdField.getInputProps({ id: "ttnAppId" })}
                    type="text"
                    name="ttn.appId"
                    id=" ttnAppId"
                    required
                    defaultValue={data["ttn.appId"]}
                    autoComplete="mqttDecodeOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!ttnEnabled}
                  />
                </div>
                {ttnAppIdField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {ttnAppIdField.error}
                  </span>
                )}
              </div>
            </div>

            <div
              data-error={ttnAppIdField.error !== undefined}
              className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <label
                htmlFor="ttnDeviceId"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Device ID
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
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
                    {...ttnDeviceIdField.getInputProps({ id: "ttnDeviceId" })}
                    type="text"
                    name="ttn.devId"
                    id="ttnDeviceId"
                    required
                    defaultValue={data["ttn.devId"]}
                    autoComplete="ttnDeviceId"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!ttnEnabled}
                  />
                </div>
                {ttnDeviceIdField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {ttnDeviceIdField.error}
                  </span>
                )}
              </div>
            </div>

            <div
              data-error={ttnDeviceIdField.error !== undefined}
              className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <label
                htmlFor="ttnDecodeProfile"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Decoding Profile
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
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
                    {...ttnDecodeProfileField.getInputProps({
                      id: "ttnDecodeProfile",
                    })}
                    name="ttn.decodeProfile"
                    id="ttnDecodeProfile"
                    required
                    placeholder="Profile"
                    value={ttnDecodeProfile}
                    onChange={(e) => {
                      setTtnDecodeProfile(e.target.value);
                      ttnDecodeProfileField.validate();
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
                {ttnDecodeProfileField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {ttnDecodeProfileField.error}
                  </span>
                )}
              </div>
            </div>

            <div
              data-error={ttnDecodeProfileField.error !== undefined}
              className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <label
                htmlFor="ttnDecodeOptions"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Decoding Options
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
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
                    {...ttnDecodeOptionsField.getInputProps({
                      id: "ttnDecodeOptions",
                    })}
                    type="text"
                    name="ttn.decodeOptions"
                    id="ttnDecodeOptions"
                    required
                    defaultValue={data["ttn.decodeOptions"]}
                    autoComplete="ttnDecodeOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={
                      !ttnEnabled ||
                      ttnDecodeProfile === "sensebox/home" ||
                      ttnDecodeProfile === "cayenne-lpp" ||
                      ttnDecodeProfile === undefined
                    }
                  />
                </div>
                {ttnDecodeOptionsField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {ttnDecodeOptionsField.error}
                  </span>
                )}
              </div>
            </div>

            <div
              data-error={ttnDecodeOptionsField.error !== undefined}
              className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <label
                htmlFor="ttnPort"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Port (optional)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
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
                    {...ttnPortField.getInputProps({ id: "ttnPort" })}
                    type="number"
                    name="ttn.port"
                    id="ttnPort"
                    value={data["ttn.port"]}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!ttnEnabled}
                  />
                </div>
                {ttnPortField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {ttnPortField.error}
                  </span>
                )}
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
          <div className="mt-6 sm:mt-5">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="mqttUrl"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                URL
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm font-thin">{t("mqtt_url_info")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    {...mqttUrlField.getInputProps({ id: "mqttUrl" })}
                    type="url"
                    name="mqtt.url"
                    id="name"
                    required
                    defaultValue={data.mqttUrl}
                    autoComplete="mqttUrl"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
                {mqttUrlField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {mqttUrlField.error}
                  </span>
                )}
              </div>
            </div>

            <div
              data-error={mqttUrlField.error !== undefined}
              className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <label
                htmlFor="mqttTopic"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2 "
              >
                Topic
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm font-thin">
                        {t("mqtt_topic_info")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    {...mqttTopicField.getInputProps({ id: "mqttTopic" })}
                    type="text"
                    name="mqtt.topic"
                    id="mqttTopic"
                    required
                    defaultValue={data.mqttTopic}
                    autoComplete="mqttTopic"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
                {mqttTopicField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {mqttTopicField.error}
                  </span>
                )}
              </div>
            </div>

            <div
              data-error={mqttTopicField.error !== undefined}
              className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <div>
                <label
                  className="flex text-base font-medium text-gray-900 sm:text-sm sm:text-gray-700"
                  id="label-notifications"
                  htmlFor="mqttFormat"
                >
                  Message format
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="h-full" asChild>
                        <InfoIcon className="ml-2 h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-thin">
                          {t("mqtt_message_format_info")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                        {...mqttFormatField.getInputProps({
                          id: "format-json",
                        })}
                        id="format-json"
                        name="mqtt.messageFormat"
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
                        {...mqttFormatField.getInputProps({ id: "format-csv" })}
                        id="format-csv"
                        name="mqtt.messageFormat"
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
                  {mqttFormatField.error && (
                    <span className="ml-1 text-sm font-medium text-red-500">
                      {mqttFormatField.error}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              data-error={mqttFormatField.error !== undefined}
              className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <label
                htmlFor="mqttDecodeOptions"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Decoding options
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[300px] text-sm font-thin">
                        {t("mqtt_decode_options_info")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    {...mqttDecodeOptionsField.getInputProps({
                      id: "mqttDecodeOptions",
                    })}
                    type="text"
                    name="mqtt.decodeOptions"
                    id="mqttDecodeOptions"
                    required
                    defaultValue={data.mqttDecodeOptions}
                    autoComplete="mqttDecodeOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
                {mqttDecodeOptionsField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {mqttDecodeOptionsField.error}
                  </span>
                )}
              </div>
            </div>

            <div
              data-mqttdecodeoptionserror={
                mqttDecodeOptionsField.error !== undefined
              }
              data-mqttconnectoptionserror={
                mqttConnectOptionsField.error !== undefined
              }
              className="pt-5 data-[mqttconnectoptionserror=false]:mb-6 data-[mqttdecodeoptionserror=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
            >
              <label
                htmlFor="mqttConnectOptions"
                className="flex text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Connect options
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="h-full" asChild>
                      <InfoIcon className="ml-2 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm font-thin">
                        {t("mqtt_connect_options_info")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <input
                    {...mqttConnectOptionsField.getInputProps({
                      id: "mqttConnectOptions",
                    })}
                    type="text"
                    name="mqtt.connectOptions"
                    id="mqttConnectOptions"
                    required
                    defaultValue={data.mqttConnectOptions}
                    autoComplete="mqttConnectOptions"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 disabled:opacity-50 disabled:hover:cursor-not-allowed sm:text-sm"
                    disabled={!mqttEnabled}
                  />
                </div>
                {mqttConnectOptionsField.error && (
                  <span className="ml-1 text-sm font-medium text-red-500">
                    {mqttConnectOptionsField.error}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}
        <br />
      </div>
    </div>
  );
}
