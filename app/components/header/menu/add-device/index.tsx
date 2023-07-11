import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "~/components/ui/use-toast";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import * as z from "zod";
import { zfd } from "zod-form-data";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, useFormContext } from "remix-validated-form";

import { useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";

import SelectDevice from "./select-device";
import General from "./general";
import SelectSensors from "./select-sensors";
import Advanced from "./advanced";
import { hasObjPropMatchWithPrefixKey } from "~/lib/helpers";

// validator for the form
export const validator = withZod(
  z.object({
    ///////////////////
    // select device //
    ///////////////////

    deviceType: z.enum(
      ["senseBox:edu", "senseBox:home", "luftdaten.info", "own:device"],
      {
        errorMap: (issue, ctx) => {
          return { message: "Please select your device type." };
        },
      }
    ),

    /////////////
    // general //
    /////////////

    general: z.object({
      name: zfd.text(
        z.string().min(3, {
          message: "Name must be at least 3 characters long.",
        })
      ),

      exposure: z.enum(["indoor", "outdoor", "mobile", "unknown"]),

      groupId: zfd.text(
        z
          .union([z.string().length(0), z.string().min(3)])
          .optional()
          .transform((e) => (e === "" ? undefined : e))
      ),
    }),

    ////////////////////
    // select sensors //
    ////////////////////

    //////////////
    // advanced //
    //////////////

    // mqtt
    mqtt: z
      .object({
        enabled: zfd.checkbox({ trueValue: "on" }),

        url: zfd.text(
          z.string().url({
            message: "Please enter a valid URL.",
          })
        ),

        topic: zfd.text(
          z.string().min(1, {
            message: "Please enter a valid topic.",
          })
        ),

        messageFormat: z.enum(["json", "csv"], {
          errorMap: (issue, ctx) => {
            return { message: "Please select your device type." };
          },
        }),

        decodeOptions: zfd.text(
          z.string().min(1, {
            message: "Please enter valid decode options.",
          })
        ),

        connectionOptions: zfd.text(
          z.string().min(1, {
            message: "Please enter valid connect options.",
          })
        ),
      })
      .optional(),

    // ttn
    ttn: z
      .object({
        enabled: zfd.checkbox({ trueValue: "on" }),

        app_id: zfd.text(
          z.string().min(1, {
            message: "Please enter a valid App ID.",
          })
        ),

        dev_id: zfd.text(
          z.string().min(1, {
            message: "Please enter a valid Device ID.",
          })
        ),
      })
      .optional(),
  })
);

interface AddDeviceDialogProps {
  isAddDeviceDialogOpen: boolean;
  setIsAddDeviceDialogOpen: (value: boolean) => void;
}

export default function AddDeviceDialog(props: AddDeviceDialogProps) {
  const data = useActionData();
  if (data !== undefined) {
    console.log("🚀 ~ file: index.tsx:134 ~ AddDeviceDialog ~ data", data);
  }

  const formContext = useFormContext("add-device-form");

  const navigation = useNavigation();
  const isSubmitting = Boolean(navigation.state === "submitting");

  const [tabValue, setTabValue] = useState<string>("device");

  return (
    <div className="w-full">
      <Dialog
        open={props.isAddDeviceDialogOpen}
        onOpenChange={props.setIsAddDeviceDialogOpen}
      >
        <DialogContent className="top-[10%] w-full sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Device</DialogTitle>
            <DialogDescription>
              In the following form you can add a senseBox to your account.
            </DialogDescription>
          </DialogHeader>
          <ValidatedForm
            id="add-device-form"
            action="/explore/add-device"
            method="post"
            validator={validator}
            defaultValues={{
              deviceType: undefined,
              general: {
                name: "",
                exposure: "unknown",
                groupId: "",
              },
              mqtt: {
                enabled: false,
                url: "",
                topic: "",
                messageFormat: "json",
                decodeOptions: "",
                connectionOptions: "",
              },
              ttn: {
                enabled: false,
                app_id: "",
                dev_id: "",
              },
            }}
            onSubmit={(e) => {
              toast({
                description: "You subbmitted the form!",
              });
              setTabValue("device");
              props.setIsAddDeviceDialogOpen(false);
            }}
            className="space-y-8"
          >
            <Tabs
              value={tabValue}
              onValueChange={setTabValue}
              className="w-full"
              activationMode="manual"
            >
              <TabsList className="w-full justify-start">
                <TabsTrigger
                  value="device"
                  data-error={hasObjPropMatchWithPrefixKey(
                    formContext.fieldErrors,
                    ["device"]
                  )}
                  className="flex data-[completed=true]:text-green-100  data-[error=true]:text-red-500"
                >
                  <p>Device</p>
                  {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                    "device",
                  ]) ? (
                    <ExclamationCircleIcon className="h-5 w-5" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  value="general"
                  data-error={hasObjPropMatchWithPrefixKey(
                    formContext.fieldErrors,
                    ["general"]
                  )}
                  className="flex data-[completed=true]:text-green-100  data-[error=true]:text-red-500"
                >
                  <p>General</p>
                  {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                    "general",
                  ]) ? (
                    <ExclamationCircleIcon className="h-5 w-5" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="sensors">Sensors</TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  data-error={hasObjPropMatchWithPrefixKey(
                    formContext.fieldErrors,
                    ["mqtt", "ttn"]
                  )}
                  className="flex data-[completed=true]:text-green-100  data-[error=true]:text-red-500"
                >
                  <p>Advanced</p>
                  {hasObjPropMatchWithPrefixKey(formContext.fieldErrors, [
                    "mqtt",
                    "ttn",
                  ]) ? (
                    <ExclamationCircleIcon className="h-5 w-5" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              <TabsContent
                value="device"
                className="focus-visible:ring-0"
                forceMount
                hidden={tabValue !== "device"}
              >
                <SelectDevice setTabValue={setTabValue} />
              </TabsContent>
              <TabsContent
                value="general"
                // data-state="active"
                forceMount
                hidden={tabValue !== "general"}
              >
                <General setTabValue={setTabValue} />
              </TabsContent>
              <TabsContent
                value="sensors"
                forceMount
                hidden={tabValue !== "sensors"}
              >
                <SelectSensors setTabValue={setTabValue} />
              </TabsContent>
              <TabsContent
                value="advanced"
                forceMount
                hidden={tabValue !== "advanced"}
              >
                <Advanced setTabValue={setTabValue} />
              </TabsContent>
              <TabsContent value="summary">
                <div>Summary</div>
                <div className="flex justify-between p-2">
                  <Button type="button" onClick={() => setTabValue("advanced")}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating device..." : "Submit"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </ValidatedForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}
