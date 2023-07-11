import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Button } from "~/components/ui/button";
import { useField } from "remix-validated-form";

interface GeneralProps {
  // deviceName: string;
  // setDeviceName: (value: string) => void;
  setTabValue: (value: string) => void;
}

export default function General(props: GeneralProps) {
  const nameField = useField("general.name");
  const exposureField = useField("general.exposure");
  const groupIdField = useField("general.groupId");

  return (
    <div>
      <div>
        <br />
        <Label htmlFor="deviceName" className="font-semibold">
          Name of your station
        </Label>
        {nameField.error && (
          <span className="ml-2 text-red-500">{nameField.error}</span>
        )}
        <Input
          {...nameField.getInputProps({ id: "general.name" })}
          id="deviceName"
          type="text"
          name="general.name"
        />
        <br />
        <Label htmlFor="deviceExposure" className="font-semibold">
          Exposure
        </Label>
        {exposureField.error && (
          <span className="ml-2 text-red-500">{exposureField.error}</span>
        )}
        <RadioGroup
          {...exposureField.getInputProps({ id: "general.exposure" })}
          name="general.exposure"
          id="deviceExposure"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="indoor" id="indoor" />
            <Label htmlFor="indoor">indoor</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="outdoor" id="outdoor" />
            <Label htmlFor="outdoor">outdoor</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mobile" id="mobile" />
            <Label htmlFor="mobile">mobile</Label>
          </div>
        </RadioGroup>
        <br />
        <Label htmlFor="deviceGroupId" className="font-semibold">
          Group ID (optional)
        </Label>
        <Input
          {...groupIdField.getInputProps({ id: "general.groupId" })}
          type="text"
          id="deviceGroupId"
          name="general.groupId"
          defaultValue={undefined}
        />
        {groupIdField.error && (
          <span className="text-red-500">{groupIdField.error}</span>
        )}
        <br />
      </div>

      <div className="flex justify-between p-2">
        <Button type="button" onClick={() => props.setTabValue("device")}>
          Back
        </Button>
        <Button type="button" onClick={() => props.setTabValue("sensors")}>
          Next
        </Button>
      </div>
    </div>
  );
}
