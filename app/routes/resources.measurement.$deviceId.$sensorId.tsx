import type { Measurement } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node"; // or cloudflare/deno
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

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

  await prisma.measurement.createMany({
    data: measurements,
  });

  return null;
};
