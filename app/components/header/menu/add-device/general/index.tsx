import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Button } from "~/components/ui/button";

interface GeneralProps {
  setTabValue: (value: string) => void;
}

export default function General(props: GeneralProps) {
  return (
    <div>
      <div>
        <br />
        <Label htmlFor="name" className="font-semibold">
          Name of your station
        </Label>
        <Input type="text" id="name" name="name" />
        <br />
        <Label htmlFor="exposure" className="font-semibold">
          Exposure
        </Label>
        <RadioGroup id="exposure">
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
        <Label htmlFor="groupId" className="font-semibold">
          Group identifier
        </Label>
        <Input type="text" id="groupId" name="groupId" />
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
