import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useNavigation } from "@remix-run/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import Spinner from "../../../spinner";
import { Separator } from "~/components/ui/separator";

export default function FilterOptions() {
  //* searchParams hook
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  // To show more phenomena options
  const [seeMorePhenomena, setSeeMorePhenomena] = useState(false);

  //* Set initial filter params based on url Search Params
  const [exposureVal, setExposureVal] = useState(
    searchParams.get("exposure") ?? null,
  );
  const [statusVal, setStatusVal] = useState(
    searchParams.get("status") ?? null,
  );
  const [phenomenonVal, setPhenomenonVal] = useState(
    searchParams.get("phenomenon") ?? null,
  );

  //* Update filter params based on url Search Params
  useEffect(() => {
    setExposureVal(searchParams.get("exposure") ?? null);
    setStatusVal(searchParams.get("status") ?? null);
    setPhenomenonVal(searchParams.get("phenomenon") ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="mt-[8px] space-y-3 px-3 py-[3px] dark:text-zinc-200">
      {navigation.state === "loading" && (
        <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <Spinner />
        </div>
      )}
      <div className="space-y-2">
        <div className="space-y-[2px]">
          <Label className="text-base">Exposure: </Label>
          &nbsp;
          <Select
            value={exposureVal ?? undefined}
            onValueChange={(value) => {
              if (value === "all") {
                searchParams.delete("exposure");
              } else {
                searchParams.set("exposure", value);
              }
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="h-6 w-full border-4 text-base dark:border-zinc-800">
              <SelectValue className="h-6">{exposureVal ?? "---"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="indoor">indoor</SelectItem>
              <SelectItem value="outdoor">outdoor</SelectItem>
              <SelectItem value="mobile">mobile</SelectItem>
              <SelectItem value="unknown">unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-[2px]">
          <Label className="text-base">Status: </Label>
          &nbsp;
          <Select
            value={statusVal ?? undefined}
            onValueChange={(value) => {
              if (value === "all") {
                searchParams.delete("status");
              } else {
                searchParams.set("status", value);
              }
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6">{statusVal ?? "---"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="inactive">inactive</SelectItem>
              <SelectItem value="old">old</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-[2px]">
          <Label className="text-base">Phenomenon: </Label>
          &nbsp;
          <Select
            value={phenomenonVal ?? undefined}
            onValueChange={(value) => {
              if (value === "all") {
                searchParams.delete("phenomenon");
              } else {
                searchParams.set("phenomenon", value);
              }
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6">
                {phenomenonVal ?? "---"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="overflow-y-auto max-h-[4rem]">
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="Temperatur">Temperatur</SelectItem>
              <SelectItem value="Helligkeit">Helligkeit</SelectItem>
              <SelectItem value="PM10">PM10</SelectItem>
              <SelectItem value="PM2.5">PM2.5</SelectItem>
              <SelectItem value="Luftdruck">Luftdruck</SelectItem>
              <SelectItem value="Luftfeuchtigkeit">Luftfeuchtigkeit</SelectItem>
              {!seeMorePhenomena &&
                ![
                  "Radioactivity",
                  "08A Pressure BME680",
                  "08A Temperature SHT31 flex",
                ].includes(phenomenonVal ?? "") && (
                  <>
                    <Separator />
                    <button
                      className="py-1.5 pl-8 pr-2 text-sm"
                      onClick={() => {
                        setSeeMorePhenomena(true);
                      }}
                    >
                      See More
                    </button>
                  </>
                )}

              {(seeMorePhenomena ||
                [
                  "Radioactivity",
                  "08A Pressure BME680",
                  "08A Temperature SHT31 flex",
                ].includes(phenomenonVal ?? "")) && (
                <>
                  <SelectItem value="Radioactivity">Radioactivity</SelectItem>
                  <SelectItem value="08A Pressure BME680">
                    08A Pressure BME680
                  </SelectItem>
                  <SelectItem value="08A Temperature BME680">
                    08A Temperature BME680
                  </SelectItem>
                  <SelectItem value="08A Temperature SHT31 flex">
                    08A Temperature SHT31
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-between">
        <Label className="rounded-[5px] border-[1px] border-[#e2e8f0] px-2 py-[1px] text-base leading-[2.2]">
          Results ({"need to get this from somewhere"})
        </Label>
        <Button
          variant="outline"
          className=" px-2 py-[1px] text-base rounded-[5px] border-[1px] border-[#e2e8f0]"
          onClick={() => {
            searchParams.delete("exposure");
            searchParams.delete("status");
            searchParams.delete("phenomenon");
            setSearchParams(searchParams);
          }}
        >
          <span>
            <X className=" m-0 inline h-3.5 w-3.5 p-0 align-sub" /> Reset
            filters
          </span>
        </Button>
      </div>
    </div>
  );
}
