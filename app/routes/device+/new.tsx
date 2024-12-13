import {
  type ActionFunctionArgs,
  redirect,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/node";
import ValidationStepperForm from "~/components/device/new/new-device-stepper";
import { NavBar } from "~/components/nav-bar";
import { createDevice } from "~/models/device.server";
import { getUser, getUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return redirect("/login");
  }
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const rawData = formData.get("formData") as string;

  try {
    const userId = await getUserId(request);

    if (!userId) {
      throw new Error("User is not authenticated.");
    }

    const data = JSON.parse(rawData);

    // Map sensors from nested objects to a flat array
    const sensors = data["sensor-selection"].selectedSensors.map(
      (sensor: any) => ({
        title: sensor.title,
        sensorType: sensor.sensorType,
        unit: sensor.unit,
      }),
    );

    // Construct the device payload
    const devicePayload = {
      name: data["general-info"].name,
      exposure: data["general-info"].exposure,
      expiresAt: data["general-info"].temporaryExpirationDate,
      tags: data["general-info"].tags?.map((tag: { value: string }) => tag.value) || [],
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      model: data["device-selection"].model,
      sensors,
      mqttEnabled: data.advanced.mqttEnabled,
      ttnEnabled: data.advanced.ttnEnabled,
    };

    // Call server function
    const newDevice = await createDevice(devicePayload, userId);
    console.log("🚀 ~ New Device Created:", newDevice);

    return json({ success: true, device: newDevice });
  } catch (error) {
    console.error("Error creating device:", error);
    return json({ error: "Failed to create device" }, { status: 400 });
  }
}

export default function NewDevice() {
  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex-grow bg-gray-100 overflow-auto">
        <div className="flex h-full w-full justify-center py-10">
          <div className="w-full h-full flex items-center justify-center rounded-lg p-6 dark:shadow-none dark:bg-transparent dark:text-dark-text">
            <ValidationStepperForm />
          </div>
        </div>
      </div>
    </div>
  );
}
