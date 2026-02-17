import invariant from "tiny-invariant";
import { drizzleClient } from "./db.server";
import { integration } from "./schema/integration";

let seedPromise: Promise<void> | undefined;

export function ensureIntegrationsSeeded() {
  if (!seedPromise) seedPromise = seed();
  return seedPromise;
}

async function seed() {
  const mqttUrl = process.env.MQTT_SERVICE_URL;
  const ttnUrl = process.env.TTN_SERVICE_URL;

  invariant(mqttUrl, "MQTT_SERVICE_URL env var not set");
  invariant(ttnUrl, "TTN_SERVICE_URL env var not set");

  console.log("[bootstrap] Ensuring integrations…");

  await drizzleClient
    .insert(integration)
    .values([
      {
        name: "MQTT",
        slug: "mqtt",
        serviceUrl: mqttUrl,
        serviceKey: "MQTT_SERVICE_KEY",
        icon: "message-square-text",
        order: 1,
      },
      {
        name: "The Things Network",
        slug: "ttn",
        serviceUrl: ttnUrl,
        serviceKey: "TTN_SERVICE_KEY",
        icon: "antenna",
        order: 2,
      },
    ])
    .onConflictDoNothing();

  console.log("[bootstrap] Integrations ready");
}
