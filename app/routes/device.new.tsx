import { type ActionFunctionArgs, redirect, type LoaderFunctionArgs } from "react-router";
import ValidationStepperForm from "~/components/device/new/new-device-stepper";
import { NavBar } from "~/components/nav-bar";
import { createDevice } from "~/models/device.server";
import { getIntegrations } from "~/models/integration.server";
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

    // Map sensors from nested objects
    const sensors = data["sensor-selection"].selectedSensors.map(
      (sensor: any) => ({
        title: sensor.title,
        sensorType: sensor.sensorType,
        unit: sensor.unit,
      })
    );

    // Construct device payload 
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
    };

    // -----------------------------
    // Create device in OpenSenseMap
    // -----------------------------
    const newDevice = await createDevice(devicePayload, userId);
    const deviceId = newDevice.id;

    const integrations = await getIntegrations();

    for (const intg of integrations) {
      const enabledKey = `${intg.slug}Enabled`; 
      const configKey = `${intg.slug}Config`; 
      
      const config = advanced[configKey];
        if (!config) {
          console.warn(`${intg.name} is enabled but no config provided`);
          continue;
        }

      // Check if this integration is enabled in the form data
      if (!advanced?.[enabledKey] || !advanced?.[configKey]) {
        continue; 
      }

      try {

        const serviceKey = process.env[intg.serviceKeyEnvVar];
        
        if (!serviceKey) {
          throw new Error(
            `Service key env var '${intg.serviceKeyEnvVar}' not configured`
          );
        }

        const response = await fetch(
          `${intg.serviceUrl}/integrations/${deviceId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-service-key": serviceKey,
            },
            body: JSON.stringify(advanced[configKey]),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Failed: ${response.status} - ${errText}`);
        }

        console.log(`✅ Created ${intg.name} integration for device ${deviceId}`);
      } catch (error) {
        console.error(`Failed to create ${intg.name} integration:`, error);
        
      }
    }

    console.log("🚀 Device Created:", newDevice.id);

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
