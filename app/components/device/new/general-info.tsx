import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "~/components/ui/label";
import { Plus, Cloud, Home, HelpCircle, Bike, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";

type ExposureOption = "outdoor" | "indoor" | "mobile" | "unknown";

export function GeneralInfoStep() {
  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tags", // Tags array
  });

  const currentExposure = watch("exposure", "unknown"); // Watch exposure value

  const addTag = (event: React.FormEvent) => {
    event.preventDefault();
    const tagInput = document.getElementById("tag-input") as HTMLInputElement;
    if (tagInput?.value.trim()) {
      append({ value: tagInput.value.trim() }); // Append a new tag object
      tagInput.value = ""; // Clear input
    }
  };

  const exposureOptions: {
    value: ExposureOption;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { value: "outdoor", icon: <Cloud className="w-6 h-6" />, label: "Outdoor" },
    { value: "indoor", icon: <Home className="w-6 h-6" />, label: "Indoor" },
    {
      value: "mobile",
      icon: <Bike className="w-6 h-6" />,
      label: "Mobile",
    },
    {
      value: "unknown",
      icon: <HelpCircle className="w-6 h-6" />,
      label: "Unknown",
    },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col justify-evenly p-2">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          defaultValue={watch("name")} // Set default value from form state
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
        <div className="flex flex-wrap gap-2 mt-2">
          {exposureOptions.map((option) => (
            <Button
              key={option.value}
              type="button" // Prevent form submission
              onClick={() => setValue("exposure", option.value)}
              variant={"outline"}
              className={`flex items-center gap-2 transition-all duration-200 ease-in-out ${
                currentExposure === option.value
                  ? "shadow-md hover:bg-green-100 bg-green-100"
                  : "hover:bg-gray-100"
              }`}
            >
              {option.icon}
              <span className="text-sm">{option.label}</span>
            </Button>
          ))}
        </div>
        {errors.exposure && (
          <p className="text-sm text-red-600">
            {String(errors.exposure.message)}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tag-input" className="text-base">
          Tags:
        </Label>
        <div className="flex space-x-2">
          <Input
            id="tag-input"
            type="text"
            placeholder="Add a tag"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(e); // Call addTag on Enter key
              }
            }}
          />
          <Button variant={"outline"} onClick={addTag} aria-label="Add tag">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {fields.map((field, index) => (
            <Badge
              key={field.id}
              variant="secondary"
              className="text-sm flex items-center"
            >
              {getValues(`tags.${index}.value`)}
              <button
                onClick={() => remove(index)}
                className="ml-2 text-xs flex items-center justify-center"
                aria-label="Remove tag"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
