import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { GeneralInfoStep } from "./general-info";
import { LocationStep } from "./location-info";
import { DeviceSelectionStep } from "./device-info";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { SensorSelectionStep } from "./sensors-info";

const generalInfoSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .min(1, "Name is required"),
  exposure: z.enum(["indoor", "outdoor", "mobile", "unknown"], {
    errorMap: () => ({ message: "Exposure is required" }),
  }),
  tags: z
    .array(
      z.object({
        value: z.string(),
      }),
    )
    .optional(),
});

const locationSchema = z.object({
  latitude: z.coerce
    .number({
      invalid_type_error: "Latitude must be a valid number",
      required_error: "Latitude is required",
    })
    .min(-90, "Latitude must be greater than or equal to -90")
    .max(90, "Latitude must be less than or equal to 90"),
  longitude: z.coerce
    .number({
      invalid_type_error: "Longitude must be a valid number",
      required_error: "Longitude is required",
    })
    .min(-180, "Longitude must be greater than or equal to -180")
    .max(180, "Longitude must be less than or equal to 180"),
});

const hardwareSchema = z.object({
  hardwareId: z.string().min(1, "Hardware selection is required"),
});

const Stepper = defineStepper(
  { id: "general-info", label: "General Info", schema: generalInfoSchema },
  { id: "location", label: "Location", schema: locationSchema },
  { id: "device-selection", label: "Device Selection", schema: hardwareSchema },
  {
    id: "sensor-selection",
    label: "Sensor Selection",
    schema: z.object({ selectedSensors: z.array(z.string()).optional() }),
  },
  { id: "advanced", label: "Advanced", schema: z.object({}) },
  { id: "complete", label: "Complete", schema: z.object({}) },
);

export default function NewDeviceStepper() {
  const stepper = Stepper.useStepper();
  const form = useForm({
    mode: "onTouched",
    resolver: zodResolver(stepper.current.schema),
  });

  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    setIsFirst(stepper.isFirst); // Ensure `isFirst` is consistently resolved on the client
  }, [stepper.isFirst]);

  const onSubmit = (data: any) => {
    console.log("Form Data on Next:", data); // Log the entire form data
    if (stepper.isLast) {
      console.log("Complete!");
      stepper.reset();
    } else {
      stepper.next();
    }
  };

  return (
    <Stepper.Scoped>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 p-6 border rounded-lg w-[450px]"
        >
          <h2 className="text-lg font-medium">
            Step {stepper.current.index + 1} of {Stepper.steps.length}:{" "}
            {stepper.current.label}
          </h2>
          {stepper.switch({
            "general-info": () => <GeneralInfoStep />,
            location: () => <LocationStep />,
            "device-selection": () => <DeviceSelectionStep />,
            "sensor-selection": () => <SensorSelectionStep />,
            advanced: () => <div>Advanced</div>,
            complete: () => <CompleteComponent />,
          })}

          <div className="flex justify-between mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={stepper.prev}
              disabled={isFirst}
            >
              Back
            </Button>
            <Button type="submit">
              {stepper.isLast ? "Complete" : "Next"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Stepper.Scoped>
  );
}

function CompleteComponent() {
  return (
    <div className="text-center">Thank you! Your device has been added.</div>
  );
}
