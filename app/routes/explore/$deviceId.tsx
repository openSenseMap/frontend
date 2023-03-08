import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCatch, useLoaderData } from "@remix-run/react";
import BottomBar from "~/components/bottomBar/BottomBar";

export async function loader({ params }: LoaderArgs) {
  console.log(process.env.OSEM_API_URL);
  // request to API with deviceID
  const response = await fetch(
    process.env.OSEM_API_URL + "/boxes/" + params.deviceId
  );
  const data = await response.json();
  if (data.code === "UnprocessableEntity") {
    throw new Response("Device not found", { status: 502 });
  }
  return json(data);
}

export default function DeviceId() {
  const data = useLoaderData<typeof loader>();
  return (
    <BottomBar
      id={data._id}
      name={data.name}
      sensors={data.sensors}
      lastUpdate={data.updatedAt}
    />
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  if (caught.status === 502) {
    return (
      <div>
        <div className="flex animate-fade-in-up items-center justify-center bg-white py-10">
          <div className="text-red-500">
            Oh no, we could not find this Device ID. Are you sure it exists?
          </div>
        </div>
      </div>
    );
  }
  throw new Error(`Unsupported thrown response status code: ${caught.status}`);
}
