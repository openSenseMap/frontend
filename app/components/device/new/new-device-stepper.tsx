import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import type { FieldErrors } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { GeneralInfoStep } from "./general-info";
import { LocationStep } from "./location-info";
import { SummaryInfo } from "./summary-info";
import { DeviceSelectionStep } from "./device-info";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { sensorSchema, SensorSelectionStep } from "./sensors-info";
import { DeviceModelEnum } from "~/schema/enum";
import { useToast } from "~/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Info } from "lucide-react";

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

const deviceSchema = z.object({
  model: z.enum(DeviceModelEnum.enumValues, {
    errorMap: () => ({ message: "Please select a device." }),
  }),
});

// selectedSensors can be an array of sensors
const sensorsSchema = z.object({
  selectedSensors: z
    .array(sensorSchema)
    .min(1, "Please select at least one sensor"),
});

const Stepper = defineStepper(
  {
    id: "general-info",
    label: "General Info",
    info: "Provide a unique name for your device, select its operating environment (outdoor, indoor, mobile, or unknown), and add relevant tags (optional).",
    schema: generalInfoSchema,
  },
  {
    id: "location",
    label: "Location",
    info: "Select the device's location by clicking on the map or entering latitude and longitude coordinates manually. Drag the marker on the map to adjust the location if needed.",
    schema: locationSchema,
  },
  {
    id: "device-selection",
    label: "Device Selection",
    info: "Select a device model from the available options",
    schema: deviceSchema,
  },
  {
    id: "sensor-selection",
    label: "Sensor Selection",
    info: "Select sensors for your device by choosing from predefined groups or individual sensors based on your device model. If using a custom device, configure sensors manually.",
    schema: sensorsSchema,
  },
  { id: "advanced", label: "Advanced", info: null, schema: z.object({}) },
  { id: "summary", label: "Summary", info: null, schema: z.object({}) },
);

type GeneralInfoData = z.infer<typeof generalInfoSchema>;
type LocationData = z.infer<typeof locationSchema>;
type DeviceData = z.infer<typeof deviceSchema>;

type FormData = GeneralInfoData &
  LocationData &
  DeviceData & { selectedSensors?: string[] };

export default function NewDeviceStepper() {
  const [formData, setFormData] = useState({});
  const stepper = Stepper.useStepper();
  const form = useForm<FormData>({
    mode: "onTouched",
    resolver: zodResolver(stepper.current.schema),
  });
  const { toast } = useToast();

  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    setIsFirst(stepper.isFirst);
  }, [stepper.isFirst]);

  const onSubmit = (data: any) => {
    // Update the accumulated data
    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [stepper.current.id]: data,
      };
      console.log("Updated Form Data:", updatedData);
      return updatedData;
    });

    // Move to the next step or complete the form
    if (stepper.isLast) {
      console.log("Complete! Final Data:", {
        ...formData,
        [stepper.current.id]: data,
      });
      stepper.reset();
    } else {
      stepper.next();
    }
  };

  const onError = (errors: FieldErrors<FormData>) => {
    const firstErrorMessage = Object.values(errors)?.[0]?.message;

    if (firstErrorMessage) {
      toast({
        title: "Form Error",
        description: firstErrorMessage,
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <Stepper.Scoped>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="h-full space-y-6 p-6 border rounded-lg w-[650px] bg-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-start gap-2">
            <h2 className="text-lg font-medium">
              Step {stepper.current.index + 1} of {Stepper.steps.length}:{" "}
              {stepper.current.label}
            </h2>
            {stepper.current.info && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger onClick={(e) => e.preventDefault()}>
                    <Info />
                  </TooltipTrigger>
                  <TooltipContent>{stepper.current.info}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="overflow-auto h-full">
            {stepper.switch({
              "general-info": () => <GeneralInfoStep />,
              location: () => <LocationStep />,
              "device-selection": () => <DeviceSelectionStep />,
              "sensor-selection": () => <SensorSelectionStep />,
              advanced: () => <div>Advanced</div>,
              summary: () => <SummaryInfo />,
            })}
          </div>
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
