import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "@remix-run/react";
import { X } from "lucide-react";
import { useContext, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { FilterOptionsContext } from "~/routes/explore";

interface FilterOptionsProps {
  devices: any;
}

/**
 * This function  is called when the user make a change on filter tab. It reaturns list of devices based on user selection.

 * @param devices all devices data
 * @param filterParams attributes and selected values
 */
function getFilteredDevices(devices: any, filterParams: URLSearchParams) {
  const { exposure, status, phenomenon } = Object.fromEntries(
    filterParams.entries()
  );
  var results: any = [];

  if (exposure === "ALL" && status === "ALL" && phenomenon === "ALL") {
    return devices;
  } else {
    for (let index = 0; index < devices.features.length; index++) {
      const device = devices.features[index];
      //* extract list of sensors titles
      const sensorsList = device.properties.sensors.map((s: any) => {
        return s.title;
      });

      if (
        (exposure === "ALL" || exposure === device.properties.exposure) &&
        (status === "ALL" || status === device.properties.status) &&
        (phenomenon === "ALL" || sensorsList.includes(phenomenon))
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

//*************************************
export default function FilterOptions({ devices }: FilterOptionsProps) {
  //* Use params in parent page url (explore)
  const {
    globalFilterParams,
    setGlobalFilterParams,
    setFilterOptionsOn,
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
    globalFilterParams.size > 0 &&
    filteredDevices.features.length != totalDevices
  ) {
    setTotalDevices(filteredDevices.features.length);
  }
  // const hostname = window.location.host;
  //* To update current url
  const currentPathname = useLocation().pathname;

  //*************************
  //* triggered when filter param is changed
  function updateFilterParams(
    exposureVal: string,
    statusVal: string,
    phenomenonVal: string
  ) {
    const filterParams = new URLSearchParams({
      exposure: `${exposureVal}`,
      status: `${statusVal}`,
      phenomenon: `${phenomenonVal}`,
    });

    setExposureVal(exposureVal);
    setStatusVal(statusVal);
    setPhenomenonVal(phenomenonVal);

    //* update url
    window.history.pushState(
      null,
      "",
      currentPathname + "?" + filterParams.toString()
    );

    setGlobalFilterParams(filterParams);
    setLocalFilterParams(false, filterParams);
  }

  //*********************** Step 2
  function setLocalFilterParams(
    isReset: boolean,
    filterParams: URLSearchParams | null
  ) {
    if (!isReset && filterParams) {
      const filteredDevices = getFilteredDevices(devices, filterParams);
      setTotalDevices(filteredDevices.features.length);
      setGlobalFilteredDevices(filteredDevices);
      setFilterOptionsOn(true);
    } else {
      setGlobalFilteredDevices(devices);
      setTotalDevices(devices.features.length);
      setExposureVal("ALL");
      setStatusVal("ALL");
      setPhenomenonVal("ALL");
    }
  }

  return (
    <div className="mt-[8px] space-y-3 border-[1px] px-3 py-[3px] ">
      <div className="space-y-2">
        <div className="space-y-[2px]">
          <Label className=" text-base">Exposure: </Label>
          &nbsp;
          <Select
            value={exposureVal}
            onValueChange={(value) => {
              updateFilterParams(value, statusVal, phenomenonVal);
            }}
          >
            <SelectTrigger className="h-6 w-full text-base">
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
              updateFilterParams(exposureVal, value, phenomenonVal);
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
              updateFilterParams(exposureVal, statusVal, value);
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
        <Label className="rounded-[5px] border-[1px] border-[#e2e8f0] px-2 py-[1px] text-base leading-[2.2]">
          Results ({totalDevices})
        </Label>

        <Button
          variant="outline"
          className=" px-2 py-[1px] text-base"
          onClick={() => {
            setLocalFilterParams(true, null);
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
