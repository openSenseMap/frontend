import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BottomBar from "~/components/bottomBar/BottomBar";

export async function loader({ params }: LoaderArgs) {
  // request to API with deviceID
  const response = await fetch(
    "https://api.opensensemap.org/boxes/" + params.deviceId
  );
  const data = await response.json();
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
