import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "@remix-run/react";
import { X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { FilterOptionsContext } from "~/routes/explore";
import { getFilteredDevices } from "~/utils";

interface FilterOptionsProps {
  devices: any;
}

//*************************************
export default function FilterOptions({ devices }: FilterOptionsProps) {
  //* Use params in parent page url (explore)
  const {
    globalFilterParams,
    filterOptionsOn,
    setFilterOptionsOn,
    setGlobalFilterParams,
    setGlobalFilteredDevices,
  } = useContext(FilterOptionsContext);
  //* Fetch params values
  const { exposure, status, phenomenon } = Object.fromEntries(
    globalFilterParams.entries()
  );
  //* Set initial filter params based on url options
  const [exposureVal, setExposureVal] = useState(
    exposure != undefined ? exposure : "ALL"
  );
  const [statusVal, setStatusVal] = useState(
    status != undefined ? status : "ALL"
  );
  const [phenomenonVal, setPhenomenonVal] = useState(
    phenomenon != undefined ? phenomenon : "ALL"
  );

  //* To show total number of shown devices
  const [totalDevices, setTotalDevices] = useState(devices.features.length);
  //* To update total resutls each time filter-option is clicked
  const filteredDevices = getFilteredDevices(devices, globalFilterParams);
  if (
    filterOptionsOn &&
    filteredDevices &&
    filteredDevices.features.length != totalDevices
  ) {
    setTotalDevices(filteredDevices.features.length);
  }
  const [searchParams, setSearchParams] = useSearchParams();

  //*************************
  //* Triggered when filter param is changed
  function filterDevices() {
    setGlobalFilterParams(searchParams);
    const filteredDevices = getFilteredDevices(devices, searchParams);
    setTotalDevices(filteredDevices.features.length);
    setGlobalFilteredDevices(filteredDevices);
    setFilterOptionsOn(true);
  }

  //*************************
  //* To reset search params to default (show all devices)
  function onFilterOptionsReset() {
    setGlobalFilteredDevices(devices);
    setFilterOptionsOn(false);
    setTotalDevices(devices.features.length);

    setExposureVal("ALL");
    setStatusVal("ALL");
    setPhenomenonVal("ALL");
  }

  //* works after updating state twice
  useEffect(() => {
    if (exposureVal) {
      searchParams.set("exposure", exposureVal ? exposureVal : "ALL");
    }
    if (statusVal) {
      searchParams.set("status", statusVal ? statusVal : "ALL");
    }
    if (phenomenonVal) {
      searchParams.set("phenomenon", phenomenonVal ? phenomenonVal : "ALL");
    }

    setSearchParams(searchParams);
  }, [exposureVal, statusVal, phenomenonVal]);

  return (
    <div className="mt-[8px] space-y-3 px-3 py-[3px] dark:text-zinc-200">
      <div className="space-y-2">
        <div className="space-y-[2px]">
          <Label className=" text-base">Exposure: </Label>
          &nbsp;
          <Select
            value={exposureVal}
            onValueChange={(value) => {
              setExposureVal(value);
              filterDevices();
            }}
          >
            <SelectTrigger className="h-6 w-full border-4 text-base dark:border-zinc-800">
              <SelectValue className="h-6" placeholder="ALL" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="ALL">all</SelectItem>
              <SelectItem value="INDOOR">indoor</SelectItem>
              <SelectItem value="OUTDOOR">outdoor</SelectItem>
              <SelectItem value="MOBILE">mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-[2px]">
          <Label className=" text-base">Status: </Label>
          &nbsp;
          <Select
            value={statusVal}
            onValueChange={(value) => {
              setStatusVal(value);
              filterDevices();
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6" placeholder="ALL" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="ALL">all</SelectItem>
              <SelectItem value="ACTIVE">active</SelectItem>
              <SelectItem value="INACTIVE">inactive</SelectItem>
              <SelectItem value="OLD">old</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-[2px]">
          <Label className=" text-base">Phenonmenon: </Label>
          &nbsp;
          <Select
            value={phenomenonVal}
            onValueChange={(value) => {
              setPhenomenonVal(value);
              filterDevices();
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6" placeholder="ALL" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="ALL">all</SelectItem>
              <SelectItem value="Temperatur">Temperatur</SelectItem>
              <SelectItem value="Helligkeit">Helligkeit</SelectItem>
              <SelectItem value="PM10">PM10</SelectItem>
              <SelectItem value="PM2.5">PM2.5</SelectItem>
              <SelectItem value="Luftdruck">Luftdruck</SelectItem>
              <SelectItem value="Luftfeuchtigkeit">Luftfeuchtigkeit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Label className="rounded-[5px] border-[1px] border-[#e2e8f0] bg-[#F2F2F2] px-2 py-[1px] text-base  leading-[2.2]">
          Results ({totalDevices})
        </Label>

        <Button
          variant="outline"
          className=" px-2 py-[1px] text-base"
          onClick={() => {
            onFilterOptionsReset();
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
