import type { Device } from "@prisma/client";
import Search from "~/components/search";
import { TimeFilter } from "./time-filter/time-filter";
import type { DateRange } from "react-day-picker";
import { Clock4Icon, Cog, IceCream2Icon } from "lucide-react";

interface NavBarHandlerProps {
  devices: Device[];
  searchString: string;
}

export default function NavbarHandler({
  devices,
  searchString,
}: NavBarHandlerProps) {
  if (searchString.length >= 2) {
    return <Search devices={devices} searchString={searchString} />;
  }

  return (
    <div className="mt-2 flex h-60 gap-4">
      <div className="flex h-full flex-1 flex-col justify-around">
        <div className="flex items-center gap-4 rounded-full bg-blue-100 px-4 py-1 text-white">
          <Clock4Icon className="h-4 w-4" />
          <span>Datum & Zeit</span>
        </div>
        <div className="flex items-center gap-4 rounded-full bg-slate-500 px-4 py-1 text-white">
          <IceCream2Icon className="h-4 w-4" />
          <span>Phänomen</span>
        </div>
        <div className="flex items-center gap-4 rounded-full bg-green-100 px-4 py-1 text-white">
          <Cog className="h-4 w-4" />
          <span>Datum & Zeit</span>
        </div>
      </div>
      <div className="flex-1">
        <TimeFilter
          dateRange={undefined}
          setDateRange={function (date: DateRange | undefined): void {
            throw new Error("Function not implemented.");
          }}
          singleDate={undefined}
          setSingleDate={function (date: Date | undefined): void {
            throw new Error("Function not implemented.");
          }}
          isDialogOpen={true}
          setIsDialogOpen={function (open: boolean): void {
            throw new Error("Function not implemented.");
          }}
          setIsHovered={function (hovered: boolean): void {
            throw new Error("Function not implemented.");
          }}
          timeState={""}
          setTimeState={function (value: string): void {
            throw new Error("Function not implemented.");
          }}
          onChange={function (timerange: any): void {
            throw new Error("Function not implemented.");
          }}
          value={undefined}
        />
      </div>
    </div>
  );
}
