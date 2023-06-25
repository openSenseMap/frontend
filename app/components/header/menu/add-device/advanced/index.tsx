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

interface AdvancedProps {
  setTabValue: (value: string) => void;
  mqttEnabled: boolean;
  setMqttEnabled: (value: boolean) => void;

  ttnEnabled: boolean;
  setTtnEnabled: (value: boolean) => void;

}

export default function Advanced(props: AdvancedProps) {
  return (
    <div>
      <div>
        <br />
        <Accordion type="single" collapsible>
          <AccordionItem value="mqtt">
            <AccordionTrigger>MQTT</AccordionTrigger>
            <AccordionContent className="px-2">
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
                  id="enableMqtt"
                  checked={props.mqttEnabled}
                  onCheckedChange={() => props.setMqttEnabled(!props.mqttEnabled)}
                />
                <label
                  htmlFor="enable MQTT"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable MQTT
                </label>
              </div>
              <br />
              <div>
                <Label htmlFor="mqttUrl" className="font-semibold">
                  URL
                </Label>
                <Input
                  type="text"
                  id="mqttUrl"
                  name="mqttUrl"
                  disabled={!props.mqttEnabled}
                />
                <br />
                <Label htmlFor="mqttTopic" className="font-semibold">
                  Topic
                </Label>
                <Input
                  type="text"
                  id="mqttTopic"
                  name="mqttTopic"
                  disabled={!props.mqttEnabled}
                />
                <br />
                <Label htmlFor="mqttFormat" className="font-semibold">
                  Message format
                </Label>
                <RadioGroup id="mqttFormat" disabled={!props.mqttEnabled}>
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
                <Label htmlFor="mqttDecodeOpt" className="font-semibold">
                  Decoding options
                </Label>
                <Input
                  type="text"
                  id="mqttDecodeOpt"
                  name="mqttDecodeOpt"
                  disabled={!props.mqttEnabled}
                />
                <br />
                <Label htmlFor="mqttConnectOpt" className="font-semibold">
                  Topic
                </Label>
                <Input
                  type="text"
                  id="mqttConnectOpt"
                  name="mqttConnectOpt"
                  disabled={!props.mqttEnabled}
                />
              </div>
              <br />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ttn">
            <AccordionTrigger>TheThingsNetwork - TTN</AccordionTrigger>
            <AccordionContent className="px-2">
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
                  id="enableTtn"
                  checked={props.ttnEnabled}
                  onCheckedChange={() => props.setTtnEnabled(!props.ttnEnabled)}
                />
                <label
                  htmlFor="enableTtn"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable MQTT
                </label>
              </div>
              <br />
              <div>
                <Label htmlFor="ttnAppId" className="font-semibold">
                  TTN Application ID
                </Label>
                <Input
                  type="text"
                  id="ttnAppId"
                  name="ttnAppId"
                  disabled={!props.ttnEnabled}
                />
                <br />
                <Label htmlFor="ttnDeviceId" className="font-semibold">
                  TTN Device ID
                </Label>
                <Input
                  type="text"
                  id="ttnDeviceId"
                  name="ttnDeviceId"
                  disabled={!props.ttnEnabled}
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
