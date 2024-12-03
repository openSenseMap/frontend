import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";

export function GeneralInfoStep() {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tags", // Tags array
  });

  const addTag = (event: React.FormEvent) => {
    event.preventDefault();
    const tagInput = document.getElementById("tag-input") as HTMLInputElement;
    if (tagInput?.value.trim()) {
      append({ value: tagInput.value.trim() }); // Append a new tag object
      tagInput.value = ""; // Clear input
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          defaultValue={getValues("name")} // Set default value from form state
          id="name"
          {...register("name")}
          className="w-full p-2 border rounded-md"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{String(errors.name.message)}</p>
        )}
      </div>
      <div>
        <Label htmlFor="exposure">Exposure</Label>
        <Select
          defaultValue={getValues("exposure")} // Set default value from form state
          onValueChange={(value) => {
            setValue("exposure", value); // Programmatically update exposure value
            console.log("Updated Exposure:", value); // Log selected value
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select exposure" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outdoor">Outdoor</SelectItem>
            <SelectItem value="indoor">Indoor</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        {errors.exposure && (
          <p className="text-sm text-red-600">
            {String(errors.exposure.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input id="tag-input" placeholder="Add a tag" className="w-full" />
            <Button onClick={addTag} type="button">
              Add Tag
            </Button>
          </div>
          <div className="space-y-1">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(`tags.${index}.value`)} // Register each tag's value
                  defaultValue={field.id} // Provide defaultValue for the field
                  className="w-full p-2 border rounded-md"
                />
                <Button
                  variant="destructive"
                  onClick={() => remove(index)} // Remove tag
                  type="button"
                  className="p-1"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
