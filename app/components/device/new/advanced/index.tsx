import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Checkbox } from "~/components/ui/checkbox";

interface AdvancedProps {
  data: any;
}

export default function Advanced({ data }: AdvancedProps) {

  const [mqttEnabled, setMqttEnabled] = useState(data.mqttEnabled);
  const [ttnEnabled, setTtnEnabled] = useState(data.ttnEnabled);

  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    undefined
  );

  return (
    <div className="space-y-6 divide-y divide-gray-200 pt-8 sm:space-y-5 sm:pt-10">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Advanced
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Advanced settings for your device.
        </p>
      </div>
      <div>
        <Accordion
          type="single"
          value={accordionValue}
          onValueChange={setAccordionValue}
          collapsible
        >
          <AccordionItem value="mqtt">
            <AccordionTrigger
              // data-error={hasObjPropMatchWithPrefixKey(
              //   formContext.fieldErrors,
              //   ["mqtt"]
              // )}
              className="data-[error=true]:text-red-500"
            >
              <div className="flex">
                <p>MQTT</p>
                {/* {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                          "mqtt",
                        ]) ? (
                          <ExclamationCircleIcon className="ml-2 h-6 w-6" />
                        ) : null} */}
              </div>
            </AccordionTrigger>
            <AccordionContent
              className="px-2"
              forceMount
              hidden={accordionValue !== "mqtt"}
            >
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>
                  openSenseMap offers a MQTT client for connecting to public
                  brokers. Documentation for the parameters is provided in the
                  docs. Please note that it's only possible to receive
                  measurements through MQTT.
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
              <br />
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
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
                        disabled={!mqttEnabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="mqttTopic"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
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
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
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
                            className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
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
                            className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
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
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
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
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
                        disabled={!mqttEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ttn">
            <AccordionTrigger
              // data-error={hasObjPropMatchWithPrefixKey(
              //   formContext.fieldErrors,
              //   ["ttn"]
              // )}
              className="data-[error=true]:text-red-500"
            >
              <div className="flex">
                <p> TheThingsNetwork - TTN</p>
                {/* {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                          "ttn",
                        ]) ? (
                          <ExclamationCircleIcon className="ml-2 h-6 w-6" />
                        ) : null} */}
              </div>
            </AccordionTrigger>
            <AccordionContent
              className="px-2"
              forceMount
              hidden={accordionValue !== "ttn"}
            >
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>
                  openSenseMap offers an integration with TheThingsNetwork.
                  Documentation for the parameters is provided on GitHub
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
                  Enable TTN
                </label>
              </div>
              <br />
              <div className="mt-6 space-y-6 sm:mt-5 sm:space-y-5">
                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="ttnAppId"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    TTN Application ID
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
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
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
                    TTN Device ID
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
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
                        disabled={!ttnEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <br />
      </div>
    </div>
  );
}
