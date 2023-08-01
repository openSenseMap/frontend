import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useLoaderData,
} from "@remix-run/react";
import { getUserId } from "~/session.server";
import { ArrowLeft } from "lucide-react";
import Home from "~/components/header/home";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { getDeviceWithoutSensors } from "~/models/device.server";
import { getSensors } from "~/models/sensor.server";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  console.log("🚀 ~ file: device.$deviceId.overview.tsx:28 ~ loader ~ userId:", userId)
  if (!userId) return redirect("/");
  console.log("🚀 ~ file: device.$deviceId.overview.tsx:32 ~ loader ~ params:", params)

  if (!params.boxId) {
    
    throw new Response("Device not found", { status: 502 });
  }
  //* get device data
  const deviceData = await getDeviceWithoutSensors({ id: params.boxId });
  //* get sensors data
  const sensorsData = await getSensors(params.boxId);

  return json({ deviceData, sensorsData });
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  return json({});
}

//**********************************
export default function DeviceOverview2() {

  const { deviceData, sensorsData } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="pointer-events-none z-10 mb-10 flex h-14 w-full p-2">
        <Home />
      </div>

      <div className="space-y-6 p-10 pb-14 mx-auto max-w-5xl font-helvetica">
        <div className="rounded text-[#676767]">
          <ArrowLeft className=" mr-2 inline h-5 w-5" />
          <Link to="/account/mydevices">Back to Dashboard</Link>
        </div>

        <div className="space-y-0.5">
          <h2 className="text-3xl font-bold tracking-normal ">
            Device Overview
          </h2>
          <p className="text-muted-foreground">
            View sensebox details and sensors.
          </p>
        </div>
        <Separator />

        <h2 className="text-2xl font-bold tracking-normal ">senseBox</h2>
        {/* sensebox table */}
        <Table>
          <TableBody className="border-[1px]">
            <TableRow>
              <TableCell className=" w-[50%] border-r-[1px]">
                senseBox Name
              </TableCell>
              <TableCell className=" w-[50%] border-r-[1px] font-semibold">
                {deviceData?.name}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className=" w-[50%] border-r-[1px]">
                senseBox Model
              </TableCell>
              <TableCell className=" w-[50%] border-r-[1px] font-semibold">
                XXXX
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className=" w-[50%] border-r-[1px]">
                Greoup identifier
              </TableCell>
              <TableCell className=" w-[50%] border-r-[1px] font-semibold">
                XXXX
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className=" w-[50%] border-r-[1px]">
                Exposure
              </TableCell>
              <TableCell className=" w-[50%] border-r-[1px] font-semibold">
                {deviceData?.exposure}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className=" w-[50%] border-r-[1px]">
                senseBox ID
              </TableCell>
              <TableCell className=" w-[50%] border-r-[1px] font-semibold">
                {deviceData?.id}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className=" w-[50%] border-r-[1px]">
                Access Token
              </TableCell>
              <TableCell className=" w-[50%] border-r-[1px] font-semibold">
                XXX
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <h2 className="text-2xl font-bold tracking-normal ">Sensors & IDs</h2>
        {/* sensers table */}
        <Table>
          <TableBody className="border-[1px]">
            {sensorsData.map((sensor)=>(
              <TableRow key={sensor.id}>
              <TableCell className=" w-[50%] border-r-[1px]">
                {sensor?.title}
              </TableCell>
              <TableCell className=" w-[50%] border-r-[1px] font-semibold">
                {sensor?.id}
              </TableCell>
            </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
