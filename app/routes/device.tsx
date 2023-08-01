import { Device, Exposure, Status } from "@prisma/client";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { typedjson } from "remix-typedjson";
import { columns } from "~/components/mydevices/dt/columns";
import { DataTable } from "~/components/mydevices/dt/data-table";
import { getUserDevices } from "~/models/device.server";
import { getUserId } from "~/session.server";



/* export async function loader({ request }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  //* get all devices data
  const allDevices = await getUserDevices(userId);

  return json(allDevices);
} */

interface UserDevices {
  devices: {
    id: string;
    name: string;
    description: string | null;
    exposure: Exposure;
    useAuth: boolean | null;
    model: string | null;
    public: boolean;
    status: Status;
    createdAt: string;
    updatedAt: string;
    latitude: number;
    longitude: number;
    userId: string;
}[];
}

export default function DevicesDashboard(devices: UserDevices) {
  // const devicesData = useLoaderData<typeof loader>();
  const devicesData = devices.devices;

  return (
     <>
      {devicesData && (
        <div className="py-8">
          <div>
            <h2 className="text-2xl font-semibold leading-tight">
              List of my Devices
            </h2>
          </div>

          <div className="mx-auto py-3">
            <DataTable columns={columns} data={devicesData} />
          </div>
        </div>
      )}
    </> 
  );
}
