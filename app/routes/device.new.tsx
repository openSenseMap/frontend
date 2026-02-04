import { type ActionFunctionArgs, redirect, type LoaderFunctionArgs } from "react-router";
import ValidationStepperForm from "~/components/device/new/new-device-stepper";
import { NavBar } from "~/components/nav-bar";
import { createDevice } from "~/models/device.server";
import { getUser, getUserId } from "~/utils/session.server";

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
    const advanced = data.advanced;

    const mqttConfig = advanced?.mqttEnabled && advanced?.mqttConfig
      ? {
          url: advanced.mqttConfig.url,
          topic: advanced.mqttConfig.topic,
          messageFormat: advanced.mqttConfig.messageFormat,
          decodeOptions: advanced.mqttConfig.decodeOptions,
          connectionOptions: advanced.mqttConfig.connectionOptions,
        }
      : undefined;

    // -----------------------------
    // Map sensors from nested objects
    // -----------------------------
    const sensors = data["sensor-selection"].selectedSensors.map(
      (sensor: any) => ({
        title: sensor.title,
        sensorType: sensor.sensorType,
        unit: sensor.unit,
      })
    );

    // -----------------------------
    // Construct device payload
    // -----------------------------
    const devicePayload = {
      name: data["general-info"].name,
      exposure: data["general-info"].exposure,
      expiresAt: data["general-info"].temporaryExpirationDate,
      tags:
        data["general-info"].tags?.map((tag: { value: string }) => tag.value) ||
        [],
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      model: data["device-selection"].model,
      sensors,
      mqttEnabled: data.advanced.mqttEnabled,
      ttnEnabled: data.advanced.ttnEnabled,
    };

    // -----------------------------
    // Create device in OpenSenseMap
    // -----------------------------
    const newDevice = await createDevice(devicePayload, userId);
    const deviceId = newDevice.id;

    // -----------------------------
    // Create MQTT integration
    // -----------------------------
    if (advanced?.mqttEnabled && mqttConfig) {
      const serviceUrl = process.env.MQTT_SERVICE_URL;
      const serviceKey = process.env.MQTT_SERVICE_KEY;

      if (!serviceUrl || !serviceKey) {
        throw new Error("MQTT service env vars are not configured");
      }

      const mqttResponse = await fetch(
        `${serviceUrl}/integrations/${deviceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-service-key": serviceKey,
          },
          body: JSON.stringify(mqttConfig),
        }
      );

      if (!mqttResponse.ok) {
        const errText = await mqttResponse.text();
        console.error("Failed to create MQTT integration:", errText);

        // Device exists already → decide whether you want rollback later
        throw new Error("Device created but MQTT setup failed");
      }
    }

    console.log("🚀 ~ New Device Created:", newDevice);
    return redirect("/profile/me");
  } catch (error) {
    console.error("Error creating device:", error);
    return redirect("/profile/me");
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
