import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "~/components/ui/button";
import { InfoIcon } from "lucide-react";
import { useField, useControlField } from "remix-validated-form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

interface SelectDeviceProps {
  setTabValue: (value: string) => void;
}

export default function SelectDevice(props: SelectDeviceProps) {
  const deviceTypeField = useField("deviceType");
  const [deviceType, setDeviceType] = useControlField<string | undefined>(
    "deviceType"
    );
    
    return (
      <div>
      <p className="text-lg font-semibold">Select your device</p>
      <p>Which hardware do you use?</p>
      {deviceTypeField.error && (
        <span className="text-red-500">{deviceTypeField.error}</span>
      )}
      <div className="grid grid-cols-4 gap-4">

        <Card
          data-checked={deviceType === "senseBox:edu"}
          onClick={() => setDeviceType("senseBox:edu")}
          className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
        >
          <CardContent className="flex justify-center pt-2">
            <AspectRatio ratio={3 / 4}>
              <img
                src="/images/"
                alt="senseBox:edu"
                className="rounded-md object-cover"
              />
            </AspectRatio>
          </CardContent>
          <CardFooter className="flex justify-center">
            <CardTitle>senseBox:edu</CardTitle>
          </CardFooter>
        </Card>

        <Card
          data-checked={deviceType === "senseBox:home"}
          onClick={() => setDeviceType("senseBox:home")}
          className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
        >
          <CardContent className="flex justify-center pt-2">
            <AspectRatio ratio={3 / 4}>
              <img
                src="/images/"
                alt="senseBox:home"
                className="rounded-md object-cover"
              />
            </AspectRatio>
          </CardContent>
          <CardFooter className="flex justify-center">
            <CardTitle>senseBox:home</CardTitle>
          </CardFooter>
        </Card>

        <Card
          data-checked={deviceType === "luftdaten.info"}
          onClick={() => setDeviceType("luftdaten.info")}
          className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
        >
          <CardContent className="flex justify-center pt-2">
            <AspectRatio ratio={3 / 4}>
              <img
                src="/images/"
                alt="Luftdaten.info"
                className="rounded-md object-cover"
              />
            </AspectRatio>
          </CardContent>
          <CardFooter className="flex justify-center">
            <CardTitle>LuftdatenInfo Device</CardTitle>
          </CardFooter>
        </Card>

        <Card
          data-checked={deviceType === "own:device"}
          onClick={() => setDeviceType("own:device")}
          className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
        >
          <CardContent className="flex justify-center pt-2">
            <AspectRatio ratio={3 / 4}>
              <img
                src="/images/"
                alt="own:device"
                className="rounded-md object-cover"
              />
            </AspectRatio>
          </CardContent>
          <CardFooter className="flex justify-center">
            <CardTitle>Own Device</CardTitle>
          </CardFooter>
        </Card>
      </div>
      {/* <div className="flex justify-end p-2">
                  <Button
                    type="button"
                    onClick={() => setDeviceType(undefined)}
                  >
                    Reset
                  </Button>
                </div> */}

      <RadioGroup
        {...deviceTypeField.getInputProps({ id: "deviceType" })}
        id="deviceType"
        name="deviceType"
        value={deviceType}
        onValueChange={(value) => {
          setDeviceType(value);
          deviceTypeField.validate();
        }}
        className="hidden"
      >
        <div>
          <RadioGroupItem value="senseBox:edu" />
        </div>
        <div>
          <RadioGroupItem value="senseBox:home" />
        </div>
        <div>
          <RadioGroupItem value="luftdaten.info" />
        </div>
        <div>
          <RadioGroupItem value="own:device" />
        </div>
      </RadioGroup>
      <div className="flex justify-end p-2">
        <Button type="button" onClick={() => props.setTabValue("general")}>
          Next
        </Button>
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
