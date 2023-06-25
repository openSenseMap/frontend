import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "~/components/ui/button";
import { InfoIcon } from "lucide-react";

interface SelectDeviceProps {
  deviceType: string | undefined;
  setDeviceType: (value: string | undefined) => void;
  setTabValue: (value: string) => void;
}

export default function SelectDevice(props: SelectDeviceProps) {
  return (
    <div>
      <p className="text-lg font-semibold">Select your device</p>
      <p>Which hardware do you use?</p>
      <div className="grid grid-cols-4 gap-4">
        <input
          type="radio"
          id="deviceType"
          name="deviceType"
          value="senseBox:edu"
          checked={props.deviceType === "senseBox:edu"}
          readOnly
          className="hidden"
        />
        <Card
          data-checked={props.deviceType === "senseBox:edu"}
          onClick={() => props.setDeviceType("senseBox:edu")}
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

        <input
          type="radio"
          id="deviceType"
          name="deviceType"
          value="senseBox:edu"
          checked={props.deviceType === "senseBox:home"}
          readOnly
          className="hidden"
        />
        <Card
          data-checked={props.deviceType === "senseBox:home"}
          onClick={() => props.setDeviceType("senseBox:home")}
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

        <input
          type="radio"
          id="deviceType"
          name="deviceType"
          value="luftdaten.info"
          checked={props.deviceType === "luftdaten.info"}
          readOnly
          className="hidden"
        />
        <Card
          data-checked={props.deviceType === "luftdaten.info"}
          onClick={() => props.setDeviceType("luftdaten.info")}
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

        <input
          type="radio"
          id="deviceType"
          name="deviceType"
          value="own:device"
          checked={props.deviceType === "own:device"}
          readOnly
          className="hidden"
        />
        <Card
          data-checked={props.deviceType === "own:device"}
          onClick={() => props.setDeviceType("own:device")}
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
