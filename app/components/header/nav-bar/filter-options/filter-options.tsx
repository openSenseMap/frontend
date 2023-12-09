import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useNavigation } from "@remix-run/react";
import { X } from "lucide-react";
import { useState, useContext } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { getFilteredDevices } from "~/utils";
import Spinner from "../../../spinner";
import { Separator } from "~/components/ui/separator";
import invariant from "tiny-invariant";
import { FilterOptionsContext } from "~/routes/explore";

interface FilterOptionsProps {
  devices: any;
}

//*************************************
export default function FilterOptions({ devices }: FilterOptionsProps) {
  //* Use  filtered devices in parent page (explore)
  const {
    filterOptionsOn,
    setFilterOptionsOn,
    GlobalFilteredDevices,
    setGlobalFilteredDevices,
  } = useContext(FilterOptionsContext);

  //* searchParams hook
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  // To show more phenomena options
  const [seeMorePhenomena, setSeeMorePhenomena] = useState(false);

  //* Set initial filter params based on url Search Params
  const [exposureVal, setExposureVal] = useState(
    searchParams.has("exposure")
      ? searchParams.get("exposure") || undefined
      : "all",
  );
  const [statusVal, setStatusVal] = useState(
    searchParams.has("status")
      ? searchParams.get("status") || undefined
      : "all",
  );
  const [phenomenonVal, setPhenomenonVal] = useState(
    searchParams.has("phenomenon")
      ? searchParams.get("phenomenon") || undefined
      : "all",
  );
  invariant(
    typeof phenomenonVal === "string",
    "phenomenonVal must be a string",
  );

  //* To show total number of shown devices
  const [totalDevices, setTotalDevices] = useState(
    filterOptionsOn
      ? (GlobalFilteredDevices as any).features.length
      : devices.features.length,
  );

  //*************************
  //* Triggered when filter param is changed
  function filterDevices() {
    // setGlobalFilterParams(searchParams);
    const filteredDevices = getFilteredDevices(devices, searchParams);
    setFilterOptionsOn(true);
    setGlobalFilteredDevices(filteredDevices);
    setTotalDevices(filteredDevices.features.length);
  }

  //*************************
  //* To reset search params to default (show all devices)
  function onFilterOptionsReset() {
    setTotalDevices(devices.features.length);
    setGlobalFilteredDevices(devices);

    setExposureVal("all");
    setStatusVal("all");
    setPhenomenonVal("all");
  }

  return (
    <div className="mt-[8px] space-y-3 px-3 py-[3px] dark:text-zinc-200">
      {navigation.state === "loading" && (
        <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <Spinner />
        </div>
      )}
      <div className="space-y-2">
        <div className="space-y-[2px]">
          <Label className=" text-base">Exposure: </Label>
          &nbsp;
          <Select
            value={exposureVal}
            onValueChange={(value) => {
              setExposureVal(value.toLocaleLowerCase());
              searchParams.set("exposure", value.toLocaleLowerCase());
              filterDevices();
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="h-6 w-full border-4 text-base dark:border-zinc-800">
              <SelectValue className="h-6" placeholder="all" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="indoor">indoor</SelectItem>
              <SelectItem value="outdoor">outdoor</SelectItem>
              <SelectItem value="mobile">mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-[2px]">
          <Label className=" text-base">Status: </Label>
          &nbsp;
          <Select
            value={statusVal}
            onValueChange={(value) => {
              setStatusVal(value.toLocaleLowerCase());
              searchParams.set("status", value.toLocaleLowerCase());
              filterDevices();
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6" placeholder="all" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="inactive">inactive</SelectItem>
              <SelectItem value="old">old</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-[2px]">
          <Label className=" text-base">Phenomenon: </Label>
          &nbsp;
          <Select
            value={phenomenonVal}
            onValueChange={(value) => {
              setPhenomenonVal(value.toLocaleLowerCase());
              searchParams.set("phenomenon", value.toLocaleLowerCase());
              filterDevices();
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="h-6 wg-full text-base">
              <SelectValue className="h-6" placeholder="all" />
            </SelectTrigger>
            <SelectContent className="">
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
                ].includes(phenomenonVal) && (
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
                ].includes(phenomenonVal)) && (
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
          Results ({totalDevices})
        </Label>

        <Button
          variant="outline"
          className=" px-2 py-[1px] text-base rounded-[5px] border-[1px] border-[#e2e8f0]"
          onClick={() => {
            onFilterOptionsReset();
            searchParams.set("exposure", "all");
            searchParams.set("status", "all");
            searchParams.set("phenomenon", "all");
            setSearchParams(searchParams);
            setFilterOptionsOn(false);
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
