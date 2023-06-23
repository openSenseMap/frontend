import { Button } from "@/components/ui/button";

interface SelectSensorsProps {
  setTabValue: (value: string) => void;
}

export default function SelectSensors(props: SelectSensorsProps) {
  return (
    <div>
      <div>Select your sensors here.</div>
      <div className="flex justify-between p-2">
        <Button type="button" onClick={() => props.setTabValue("general")}>
          Back
        </Button>
        <Button type="button" onClick={() => props.setTabValue("advanced")}>
          Next
        </Button>
      </div>
    </div>
  );
}
