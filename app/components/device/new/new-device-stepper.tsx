import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { Info, Slash } from "lucide-react";
import { useEffect, useState } from "react";
import  { type FieldErrors, FormProvider, useForm  } from "react-hook-form";
import { Form, useSubmit } from "react-router";
import { z } from "zod";
import { AdvancedStep } from "./advanced-info";
import { DeviceSelectionStep } from "./device-info";
import { GeneralInfoStep } from "./general-info";
import { LocationStep } from "./location-info";
import { sensorSchema, SensorSelectionStep } from "./sensors-info";
import { SummaryInfo } from "./summary-info";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { DeviceModelEnum } from "~/schema/enum";

const generalInfoSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .min(1, "Name is required"),
  exposure: z.enum(["indoor", "outdoor", "mobile", "unknown"], {
    errorMap: () => ({ message: "Exposure is required" }),
  }),
  temporaryExpirationDate: z
    .string()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)) // Transform string to Date
    .refine(
      (date) =>
        !date || date <= new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
      {
        message: "Temporary expiration date must be within 1 month from now",
      },
    ),
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

const mqttSchema = z
  .object({
    mqttEnabled: z.boolean().default(false),
    url: z.string().optional(),
    topic: z.string().optional(),
    messageFormat: z.enum(["json", "csv"]).optional(),
    decodeOptions: z.string().optional(),
    connectionOptions: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mqttEnabled) {
      // Check required fields when enabled is true
      if (!data.url) {
        ctx.addIssue({
          path: ["url"],
          message: "URL is required when MQTT is enabled.",
          code: "custom",
        });
      }
      if (!data.topic) {
        ctx.addIssue({
          path: ["topic"],
          message: "Topic is required when MQTT is enabled.",
          code: "custom",
        });
      }
      if (!data.messageFormat) {
        ctx.addIssue({
          path: ["messageFormat"],
          message: "Message format is required when MQTT is enabled.",
          code: "custom",
        });
      }
    }
  });

const ttnSchema = z
  .object({
    ttnEnabled: z.boolean().default(false),
    dev_id: z.string().optional(),
    app_id: z.string().optional(),
    profile: z
      .enum([
        "lora-serialization",
        "sensebox/home",
        "json",
        "debug",
        "cayenne-lpp",
      ])
      .optional(),
    decodeOptions: z.string().optional(),
    port: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ttnEnabled) {
      if (!data.dev_id) {
        ctx.addIssue({
          path: ["dev_id"],
          message: "Device ID is required when TTN is enabled.",
          code: "custom",
        });
      }

      if (!data.app_id) {
        ctx.addIssue({
          path: ["app_id"],
          message: "Application ID is required when TTN is enabled.",
          code: "custom",
        });
      }

      if (!data.profile) {
        ctx.addIssue({
          path: ["profile"],
          message: "Profile is required when TTN is enabled.",
          code: "custom",
        });
      }
    }
  });

const advancedSchema = z.intersection(mqttSchema, ttnSchema);

export const Stepper = defineStepper(
  {
    id: "general-info",
    label: "General Info",
    info: "Provide a unique name for your device, select its operating environment (outdoor, indoor, mobile, or unknown), and add relevant tags (optional).",
    schema: generalInfoSchema,
    index: 0
  },
  {
    id: "location",
    label: "Location",
    info: "Select the device's location by clicking on the map or entering latitude and longitude coordinates manually. Drag the marker on the map to adjust the location if needed.",
    schema: locationSchema,
    index: 1
  },
  {
    id: "device-selection",
    label: "Device Selection",
    info: "Select a device model from the available options",
    schema: deviceSchema,
    index: 2
  },
  {
    id: "sensor-selection",
    label: "Sensor Selection",
    info: "Select sensors for your device by choosing from predefined groups or individual sensors based on your device model. If using a custom device, configure sensors manually.",
    schema: sensorsSchema,
    index: 3
  },
  { id: "advanced", label: "Advanced", info: null, schema: advancedSchema, index: 4 },
  { id: "summary", label: "Summary", info: null, schema: z.object({}), index: 5 },
);

type GeneralInfoData = z.infer<typeof generalInfoSchema>;
type LocationData = z.infer<typeof locationSchema>;
type DeviceData = z.infer<typeof deviceSchema>;
type SensorData = z.infer<typeof sensorsSchema>;
type MqttData = z.infer<typeof mqttSchema>;
type TtnData = z.infer<typeof ttnSchema>;

type FormData = GeneralInfoData &
  LocationData &
  DeviceData &
  SensorData &
  MqttData &
  TtnData;

export default function NewDeviceStepper() {
  const submit = useSubmit();
  const [formData, setFormData] = useState<Record<string, any>>({});
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

  const onSubmit = (data: FormData) => {
    console.log("🚀 ~ onSubmit ~ data:", data);
    const updatedData = {
      ...formData,
      [stepper.current.id]: data,
    };

    setFormData(updatedData);

    if (stepper.isLast) {
      console.log("Complete! Final Data:", updatedData);

      // Submit form data as JSON
      void submit(
        {
          formData: JSON.stringify(updatedData), // Serialize the data
        },
        { method: "post" },
      );
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
        <Form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="h-full space-y-6 p-6 border rounded-lg w-1/2 bg-white flex flex-col justify-between"
        >
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <Breadcrumb>
              <BreadcrumbList>
                {Stepper.steps.map((step, index) => {
                  return (
                    <div className="flex gap-2" key={index}>
                      <BreadcrumbItem key={step.id}>
                        <BreadcrumbLink
                          onClick={() => stepper.goTo(step.id)}
                          className={`
                              ${
                                stepper.current.index === step.index
                                  ? "font-bold text-black"
                                  : "text-gray-500 cursor-pointer hover:text-black"
                              }
                            `}
                        >
                          {step.label}
                        </BreadcrumbLink>
                      </BreadcrumbItem>

                      {index < Stepper.steps.length - 1 && (
                        <BreadcrumbSeparator>
                          <Slash className="h-4 w-4" />
                        </BreadcrumbSeparator>
                      )}
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Step Header with Info */}
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
          </div>

          {/* Form Content */}
          <div className="overflow-auto h-full">
            {stepper.switch({
              advanced: () => <AdvancedStep />,
              "general-info": () => <GeneralInfoStep />,
              location: () => <LocationStep />,
              "device-selection": () => <DeviceSelectionStep />,
              "sensor-selection": () => <SensorSelectionStep />,
              summary: () => <SummaryInfo />,
            })}
          </div>

          {/* Navigation Buttons */}
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
        </Form>
      </FormProvider>
    </Stepper.Scoped>
  );
}
