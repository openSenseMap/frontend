import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "@remix-run/react";
import { Dispatch, useEffect, useState } from "react";
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

    setFilteredDevices(getFilteredDevices(devices.devices, filterParams));
    setFilterOn(true);
  }

  return (
    <div className="mt-2 space-y-3 border-[1px] p-3">
      <div className="flex justify-between">
        <Label className=" text-base">Exposure: </Label>
        &nbsp;
        <Select
          value={exposure}
          onValueChange={(value) => {
            updateFilterUrl(value, status, phenomenon);
          }}
        >
          <SelectTrigger className="h-6 w-3/4 text-base">
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
      <div className="flex justify-between">
        <Label className=" text-base">Status: </Label>
        &nbsp;
        <Select
          value={status}
          onValueChange={(value) => {
            updateFilterUrl(exposure, value, phenomenon);
          }}
        >
          <SelectTrigger className="h-6 w-3/4 text-base">
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
      <div className="flex justify-between">
        <Label className=" text-base">Phenonmenon: </Label>
        &nbsp;
        <Select
          value={phenomenon}
          onValueChange={(value) => {
            updateFilterUrl(exposure, status, value);
          }}
        >
          <SelectTrigger className="h-6 w-3/4 text-base">
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
  );
}
