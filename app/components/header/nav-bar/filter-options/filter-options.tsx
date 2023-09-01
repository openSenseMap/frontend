import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "@remix-run/react";
import { X } from "lucide-react";
import { Dispatch, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

interface FilterOptionsProps {
  devices: any;
  setFilterOn: Dispatch<any>;
  setFilteredDevices: Dispatch<any>;
}

/**
 * This function  is called when the user make a change on filter tab. It reaturns list of devices based on user selection.
 *
 * @param devices all devices data
 * @param filterParams attributes and selected values
 */
function getFilteredDevices(devices: any, filterParams: URLSearchParams) {
  const { exposure, status, phenomenon } = Object.fromEntries(
    filterParams.entries()
  );
  var results: any = [];

  if (exposure === "ANY" && status === "ANY" && phenomenon === "ANY") {
    return devices;
  } else {
    for (let index = 0; index < devices.features.length; index++) {
      const device = devices.features[index];
      //* extract list of sensors titles
      const sensorsList = device.properties.sensors.map((s: any) => {
        return s.title;
      });

      if (
        (exposure === "ANY" || exposure === device.properties.exposure) &&
        (status === "ANY" || status === device.properties.status) &&
        (phenomenon === "ANY" || sensorsList.includes(phenomenon))
      ) {
        results.push(device);
      }

      if (index === devices.features.length - 1) {
        return {
          type: "FeatureCollection",
          features: results,
        };
      }
    }
  }
}

export default function FilterOptions({
  devices,
  setFilterOn,
  setFilteredDevices,
}: FilterOptionsProps) {
  const [exposure, setExposure] = useState("ANY");
  const [status, setStatus] = useState("ANY");
  const [phenomenon, setPhenomenon] = useState("ANY");
  const [totalDevices, setTotalDevices] = useState(devices.features.length);

  // const hostname = window.location.host;
  const currentPathname = useLocation().pathname;

  function updateFilterUrl(
    exposureVal: string,
    statusVal: string,
    phenomenonVal: string
  ) {
    const filterParams = new URLSearchParams({
      exposure: `${exposureVal}`,
      status: `${statusVal}`,
      phenomenon: `${phenomenonVal}`,
    });

    setExposure(exposureVal);
    setStatus(statusVal);
    setPhenomenon(phenomenonVal);
    window.history.pushState(
      null,
      "",
      currentPathname + "?" + filterParams.toString()
    );

    const filterdDevces = getFilteredDevices(devices, filterParams);
    setTotalDevices(filterdDevces.features.length);
    setFilteredDevices(filterdDevces);
    setFilterOn(true);
  }

  function resetFilters() {
    setFilteredDevices(devices);
    setTotalDevices(devices.features.length);
    setExposure("ANY");
    setStatus("ANY");
    setPhenomenon("ANY");
  }

  return (
    <div className="mt-[8px] space-y-3 border-[1px] px-3 py-[3px] ">
      <div className="space-y-2">
        <div className="space-y-[2px]">
          <Label className=" text-base">Exposure: </Label>
          &nbsp;
          <Select
            value={exposure}
            onValueChange={(value) => {
              updateFilterUrl(value, status, phenomenon);
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6" placeholder="ANY" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="ANY">any</SelectItem>
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
            value={status}
            onValueChange={(value) => {
              updateFilterUrl(exposure, value, phenomenon);
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6" placeholder="ANY" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="ANY">any</SelectItem>
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
            value={phenomenon}
            onValueChange={(value) => {
              updateFilterUrl(exposure, status, value);
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
              <SelectValue className="h-6" placeholder="ANY" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="ANY">any</SelectItem>
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
        <Label className="rounded-[5px] border-[1px] border-[#e2e8f0] px-2 py-[1px] text-base leading-[2.2]">
          Results ({totalDevices})
        </Label>

        <Button
          variant="outline"
          className=" px-2 py-[1px] text-base"
          onClick={() => {
            resetFilters();
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
