import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Form } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { CheckIcon } from "@heroicons/react/24/outline";

import SelectDevice from "./select-device";
import General from "./general";
import SelectSensors from "./select-sensors";
import Advanced from "./advanced";

interface AddDeviceDialogProps {
  isAddDeviceDialogOpen: boolean;
  setIsAddDeviceDialogOpen: (value: boolean) => void;
}

export default function AddDeviceDialog(props: AddDeviceDialogProps) {
  const [tabValue, setTabValue] = useState<string>("device");

  // select device
  const [deviceType, setDeviceType] = useState<string | undefined>(undefined);

  // general

  // select sensors

  // advanced
  const [mqttEnabled, setMqttEnabled] = useState<boolean>(false);
  const [ttnEnabled, setTtnEnabled] = useState<boolean>(false);


  function resetForm() {
    setTabValue("device");
    setDeviceType(undefined);
  }

  return (
    <div className="w-full">
      <Dialog
        open={props.isAddDeviceDialogOpen}
        onOpenChange={props.setIsAddDeviceDialogOpen}
      >
        <DialogContent className="top-[20%] w-full sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Device</DialogTitle>
            <DialogDescription>
              In the following form you can add a senseBox to your account.
            </DialogDescription>
          </DialogHeader>
          <Form method="post">
            <Tabs
              value={tabValue}
              onValueChange={setTabValue}
              className="w-full"
            >
              <TabsList className="justify-start">
                <TabsTrigger
                  data-completed={deviceType !== undefined}
                  value="device"
                  className="flex data-[completed=true]:text-green-100"
                >
                  <p>Device</p>
                  {deviceType !== undefined ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="sensors">Sensors</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              <TabsContent value="device" className="focus-visible:ring-0">
                <SelectDevice deviceType={deviceType} setDeviceType={setDeviceType} setTabValue={setTabValue} />
              </TabsContent>
              <TabsContent value="general">
                <General setTabValue={setTabValue} />
              </TabsContent>
              <TabsContent value="sensors">
                <SelectSensors setTabValue={setTabValue} />
              </TabsContent>
              <TabsContent value="advanced">
                <Advanced setTabValue={setTabValue} mqttEnabled={mqttEnabled} setMqttEnabled={setMqttEnabled} ttnEnabled={ttnEnabled} setTtnEnabled={setTtnEnabled} />
              </TabsContent>
              <TabsContent value="summary">
                <div>Summary</div>
                <div className="flex justify-between p-2">
                  <Button type="button" onClick={() => setTabValue("advanced")}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => {
                      resetForm();
                      props.setIsAddDeviceDialogOpen(false);
                    }}
                  >
                    Create device
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
