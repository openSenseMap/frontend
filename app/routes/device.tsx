import { Exposure, Status } from "@prisma/client";
import { columns } from "~/components/mydevices/dt/columns";
import { DataTable } from "~/components/mydevices/dt/data-table";


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
