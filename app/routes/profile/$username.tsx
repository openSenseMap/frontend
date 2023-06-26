import type { Device } from "@prisma/client";
import DeviceCard from "~/components/device-card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";

const devices: Device[] = [
  {
    id: "1",
    name: "Gerät #1",
    exposure: "INDOOR",
    useAuth: false,
    model: "senseBox:home",
    createdAt: new Date(),
    updatedAt: new Date(),
    latitude: 7,
    longitude: 52,
    userId: "1",
  },
  {
    id: "2",
    name: "Gerät #2",
    exposure: "INDOOR",
    useAuth: false,
    model: "senseBox:home",
    createdAt: new Date(),
    updatedAt: new Date(),
    latitude: 7,
    longitude: 52,
    userId: "1",
  },
  {
    id: "3",
    name: "Gerät #3",
    exposure: "MOBILE",
    useAuth: false,
    model: "senseBox:bike",
    createdAt: new Date(),
    updatedAt: new Date(),
    latitude: 7,
    longitude: 52,
    userId: "1",
  },
];

export default function () {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="">
        <div className="flex flex-col space-y-2">
          <Avatar className="h-64 w-64">
            <AvatarImage src="/avatars/01.png" alt="maxm" />
            <AvatarFallback>MM</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-semibold tracking-tight">
            Max Mustermann
          </h1>
          <p className="text-sm text-muted-foreground">maxm</p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Badges</h1>
          <div></div>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <div></div>
        </div>
      </div>
      <div className="col-span-2">
        <div className="grid grid-cols-2 gap-8">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      </div>
    </div>
  );
}
