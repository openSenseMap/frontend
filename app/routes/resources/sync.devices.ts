import { json, type DataFunctionArgs } from "@remix-run/node";
import { upsertDevice } from "~/models/device.server";
import { requireAdminUser } from "~/session.server";

export async function loader({ request, params }: DataFunctionArgs) {
  await requireAdminUser(request);

  const response = await fetch(
    "https://api.opensensemap.org/boxes?minimal=true"
  );
  const devices = await response.json();

  // TODO upsert devices in postgres database
  for await (const device of devices) {
    const data = await upsertDevice(device);
    console.log(data);
  }

  // TODO return what was done!
  return json({});
}
