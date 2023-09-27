import type { ActionFunctionArgs } from "@remix-run/node"; // or cloudflare/deno
import { json } from "@remix-run/node";
import { measurement, type Measurement } from "db/schema";
import { drizzleClient } from "~/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }
  const payload: Measurement[] = await request.json();
  const measurements = payload.map((data) => ({
    sensorId: data.sensorId,
    time: new Date(data.time),
    value: Number(data.value),
  }));

  await drizzleClient.insert(measurement).values(measurements);

  return null;
};
