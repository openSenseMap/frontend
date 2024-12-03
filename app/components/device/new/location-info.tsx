import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "~/components/ui/label";

export function LocationStep() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setValue("latitude", value); // Update the latitude value in form state
      console.log("Updated Latitude:", value);
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setValue("longitude", value); // Update the longitude value in form state
      console.log("Updated Longitude:", value);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          type="number"
          {...register("latitude", {
            valueAsNumber: true,
          })} // Ensure value is treated as a number
          onChange={handleLatitudeChange} // Update value in form context
          placeholder="Enter latitude (-90 to 90)"
          className="w-full p-2 border rounded-md"
        />
        {errors.latitude && (
          <p className="text-sm text-red-600">
            {String(errors.latitude.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="longitude">Longitude</Label>
        <Input
          id="longitude"
          type="number"
          {...register("longitude", {
            valueAsNumber: true,
          })} // Ensure value is treated as a number
          onChange={handleLongitudeChange} // Update value in form context
          placeholder="Enter longitude (-180 to 180)"
          className="w-full p-2 border rounded-md"
        />
        {errors.longitude && (
          <p className="text-sm text-red-600">
            {String(errors.longitude.message)}
          </p>
        )}
      </div>
    </div>
  );
}
