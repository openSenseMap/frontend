import { useFormContext } from "react-hook-form";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function AdvancedStep() {
  const {
    // setValue,
    formState: { errors },
  } = useFormContext();

  const handleChange = (value: string) => {
    console.log("Selected Hardware:", value); // Log selected hardware
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="hardwareId">Advanced Selection</Label>
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Hardware" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Hardware 1</SelectItem>
            <SelectItem value="2">Hardware 2</SelectItem>
          </SelectContent>
        </Select>
        {errors.hardwareId && (
          <p className="text-sm text-red-600">
            {String(errors.hardwareId.message)}
          </p>
        )}
      </div>
    </div>
  );
}
