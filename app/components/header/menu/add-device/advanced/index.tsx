import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InfoIcon } from "lucide-react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";

import { useState } from "react";
import {
  useField,
  useControlField,
  useFormContext,
} from "remix-validated-form";
import { hasObjPropMatchWithPrefixKey } from "~/lib/helpers";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface AdvancedProps {
  setTabValue: (value: string) => void;
}

export default function Advanced(props: AdvancedProps) {
  const formContext = useFormContext();
  // mqtt form fields
  const [mqttEnabled, setMqttEnabled] = useControlField<boolean | undefined>(
    "mqttEnabled"
  );
  const mqttUrlField = useField("mqtt.url");
  const mqttTopicField = useField("mqtt.topic");
  const mqttFormatField = useField("mqtt.messageFormat");
  const mqttDecodeOptionsField = useField("mqtt.decodeOptions");
  const mqttConnectOptionsField = useField("mqtt.connectionOptions");

  // ttn form fields
  const [ttnEnabled, setTtnEnabled] = useControlField<boolean | undefined>(
    "ttn.enabled"
  );
  const ttnAppIdField = useField("ttn.app_id");
  const ttnDeviceIdField = useField("ttn.dev_id");

  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    undefined
  );

  return (
    <div>
      <div>
        <Accordion
          type="single"
          value={accordionValue}
          onValueChange={setAccordionValue}
          collapsible
        >
          <AccordionItem value="mqtt">
            <AccordionTrigger
              data-error={hasObjPropMatchWithPrefixKey(
                formContext.fieldErrors,
                ["mqtt"]
              )}
              className="data-[error=true]:text-red-500"
            >
              <div className="flex">
                <p>MQTT</p>
                {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                  "mqtt",
                ]) ? (
                  <ExclamationCircleIcon className="ml-2 h-6 w-6" />
                ) : null}
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
                  name="mqtt.enabled"
                  id="mqttEnabled"
                  onCheckedChange={(checked) => {
                    checked === "indeterminate"
                      ? setMqttEnabled(undefined)
                      : setMqttEnabled(checked);
                    if (checked === false) {
                      formContext.validateField("mqtt");
                    }
                  }}
                />
                <Label
                  htmlFor="mqttEnabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable MQTT
                </Label>
              </div>
              <br />
              <div>
                <Label htmlFor="mqttUrl" className="font-semibold">
                  URL
                </Label>
                {mqttUrlField.error && (
                  <span className="ml-2 text-red-500">
                    {mqttUrlField.error}
                  </span>
                )}
                <Input
                  {...mqttUrlField.getInputProps({ id: "mqtt.url" })}
                  type="url"
                  id="mqttUrl"
                  name="mqtt.url"
                  disabled={!mqttEnabled}
                />
                <br />
                <Label htmlFor="mqttTopic" className="font-semibold">
                  Topic
                </Label>
                {mqttTopicField.error && (
                  <span className="ml-2 text-red-500">
                    {mqttTopicField.error}
                  </span>
                )}
                <Input
                  {...mqttTopicField.getInputProps({ id: "mqtt.topic" })}
                  type="text"
                  id="mqttTopic"
                  name="mqtt.topic"
                  disabled={!mqttEnabled}
                />
                <br />
                <Label htmlFor="mqttFormat" className="font-semibold">
                  Message format
                </Label>
                {mqttFormatField.error && (
                  <span className="ml-2 text-red-500">
                    {mqttFormatField.error}
                  </span>
                )}
                <RadioGroup
                  {...mqttFormatField.getInputProps({
                    id: "mqtt.messageFormat",
                  })}
                  id="mqttFormat"
                  name="mqtt.messageFormat"
                  disabled={!mqttEnabled}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="mqttJson" />
                    <Label htmlFor="mqttJson">json</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="mqttCsv" />
                    <Label htmlFor="mqttCsv">csv</Label>
                  </div>
                </RadioGroup>
                <br />
                <Label htmlFor="mqttDecodeOptions" className="font-semibold">
                  Decoding options
                </Label>
                {mqttDecodeOptionsField.error && (
                  <span className="ml-2 text-red-500">
                    {mqttDecodeOptionsField.error}
                  </span>
                )}
                <Input
                  {...mqttDecodeOptionsField.getInputProps({
                    id: "mqtt.decodeOptions",
                  })}
                  type="text"
                  id="mqttDecodeOptions"
                  name="mqtt.decodeOptions"
                  disabled={!mqttEnabled}
                />
                <br />
                <Label
                  htmlFor="mqttConnectionOptions"
                  className="font-semibold"
                >
                  Connect options
                </Label>
                {mqttConnectOptionsField.error && (
                  <span className="ml-2 text-red-500">
                    {mqttConnectOptionsField.error}
                  </span>
                )}
                <Input
                  {...mqttConnectOptionsField.getInputProps({
                    id: "mqtt.connectionOptions",
                  })}
                  type="text"
                  id="mqttConnectionOptions"
                  name="mqtt.connectionOptions"
                  disabled={!mqttEnabled}
                />
              </div>
              <br />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ttn">
            <AccordionTrigger
              data-error={hasObjPropMatchWithPrefixKey(
                formContext.fieldErrors,
                ["ttn"]
              )}
              className="data-[error=true]:text-red-500"
            >
              <div className="flex">
                <p> TheThingsNetwork - TTN</p>
                {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                  "ttn",
                ]) ? (
                  <ExclamationCircleIcon className="ml-2 h-6 w-6" />
                ) : null}
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
                  name="ttn.enabled"
                  checked={ttnEnabled}
                  onCheckedChange={(checked) => {
                    checked === "indeterminate"
                      ? setTtnEnabled(undefined)
                      : setTtnEnabled(checked);
                    if (checked === false) {
                      formContext.validateField("ttn");
                    }
                  }}
                />
                <Label
                  htmlFor="ttnEnabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable TTN
                </Label>
              </div>
              <br />
              <div>
                <Label htmlFor="ttnAppId" className="font-semibold">
                  TTN Application ID
                </Label>
                {ttnAppIdField.error && (
                  <span className="ml-2 text-red-500">
                    {ttnAppIdField.error}
                  </span>
                )}
                <Input
                  {...ttnAppIdField.getInputProps({
                    id: "ttn.app_id",
                  })}
                  type="text"
                  id="ttnAppId"
                  name="ttn.app_id"
                  disabled={!ttnEnabled}
                />
                <br />
                <Label htmlFor="ttnDeviceId" className="font-semibold">
                  TTN Device ID
                </Label>
                {ttnDeviceIdField.error && (
                  <span className="ml-2 text-red-500">
                    {ttnDeviceIdField.error}
                  </span>
                )}
                <Input
                  {...ttnDeviceIdField.getInputProps({
                    id: "ttn.dev_id",
                  })}
                  type="text"
                  id="ttnDeviceId"
                  name="ttn.dev_id"
                  disabled={!ttnEnabled}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <br />
      </div>
      <div className="flex justify-between p-2">
        <Button type="button" onClick={() => props.setTabValue("sensors")}>
          Back
        </Button>
        <Button type="button" onClick={() => props.setTabValue("summary")}>
          Next
        </Button>
      </div>
    </div>
  );
}
