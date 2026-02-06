import { X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useSearchParams, useNavigation } from "react-router";
import { NavbarContext } from "..";
import Spinner from "../../../spinner";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { type DeviceExposureType, type DeviceStatusType } from "~/schema/enum";

export default function FilterOptions() {
  const { setOpen } = useContext(NavbarContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const [exposureVal, setExposureVal] = useState<DeviceExposureType | "all">(
    (searchParams.get("exposure") as DeviceExposureType) ?? "all",
  );
  const [statusVal, setStatusVal] = useState<DeviceStatusType | "all">(
    (searchParams.get("status") as DeviceStatusType) ?? "all",
  );

  const [tempExposureVal, setTempExposureVal] = useState(exposureVal);
  const [tempStatusVal, setTempStatusVal] = useState(statusVal);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setExposureVal(
      (searchParams.get("exposure") as DeviceExposureType) ?? "all",
    );
    setStatusVal((searchParams.get("status") as DeviceStatusType) ?? "all");
    setTempExposureVal(
      (searchParams.get("exposure") as DeviceExposureType) ?? "all",
    );
    setTempStatusVal((searchParams.get("status") as DeviceStatusType) ?? "all");
  }, [searchParams]);

  useEffect(() => {
    setIsChanged(
      tempExposureVal !== exposureVal || tempStatusVal !== statusVal,
    );
  }, [tempExposureVal, tempStatusVal, exposureVal, statusVal]);

  const handleApplyChanges = () => {
    setExposureVal(tempExposureVal);
    setStatusVal(tempStatusVal);
    searchParams.set("exposure", tempExposureVal);
    searchParams.set("status", tempStatusVal);
    setSearchParams(searchParams);
    setIsChanged(false);
    setOpen(false);
  };

  const handleResetFilters = () => {
    setTempExposureVal("all");
    setTempStatusVal("all");
    searchParams.set("exposure", "all");
    searchParams.set("status", "all");
    setSearchParams(searchParams);
    setIsChanged(false);
  };

  return (
    <div className="dark:text-zinc-200 flex-col h-full flex-1 gap-2 flex justify-around">
      {navigation.state === "loading" && (
        <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <Spinner />
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-[2px] flex items-center justify-between">
          <Label className="text-base">Exposure: </Label>
          <ToggleGroup
            className="w-full"
            rovingFocus={false}
            type="multiple"
            variant="outline"
            value={tempExposureVal ? tempExposureVal.split(",") : ["all"]}
            onValueChange={(values: string[]) => {
              if (values.length === 0) {
                setTempExposureVal("all");
              } else if (
                values.includes("all") &&
                values.indexOf("all") === 0
              ) {
                const filteredValues = values.filter(
                  (value) => value !== "all",
                );
                setTempExposureVal(
                  filteredValues.join(",") as DeviceExposureType | "all",
                );
              } else if (values.includes("all")) {
                setTempExposureVal("all");
              } else {
                setTempExposureVal(
                  values.join(",") as DeviceExposureType | "all",
                );
              }
            }}
          >
            <ToggleGroupItem value="all" aria-label="Toggle all">
              all
            </ToggleGroupItem>
            <ToggleGroupItem value="indoor" aria-label="Toggle indoor">
              indoor
            </ToggleGroupItem>
            <ToggleGroupItem value="outdoor" aria-label="Toggle outdoor">
              outdoor
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Toggle mobile">
              mobile
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="space-y-[2px] flex items-center justify-between">
          <Label className="text-base">Status: </Label>
          <ToggleGroup
            className="w-full"
            type="multiple"
            variant="outline"
            value={tempStatusVal ? tempStatusVal.split(",") : ["active"]}
            onValueChange={(values: string[]) => {
              if (values.length === 0) {
                setTempStatusVal("all");
              } else if (
                values.includes("all") &&
                values.indexOf("all") === 0
              ) {
                const filteredValues = values.filter(
                  (value) => value !== "all",
                );
                setTempStatusVal(
                  filteredValues.join(",") as DeviceStatusType | "all",
                );
              } else if (values.includes("all")) {
                setTempStatusVal("all");
              } else {
                setTempStatusVal(values.join(",") as DeviceStatusType | "all");
              }
            }}
          >
            <ToggleGroupItem value="all" aria-label="Toggle all">
              all
            </ToggleGroupItem>
            <ToggleGroupItem value="active" aria-label="Toggle active">
              active
            </ToggleGroupItem>
            <ToggleGroupItem value="inactive" aria-label="Toggle inactive">
              inactive
            </ToggleGroupItem>
            <ToggleGroupItem value="old" aria-label="Toggle old">
              old
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="flex justify-end gap-4 align-bottom">
        <Button
          variant="outline"
          className="px-2 py-[1px] text-base rounded-[5px] border-[1px] border-[#e2e8f0]"
          onClick={handleResetFilters}
        >
          <span className="flex items-center">
            <X className="m-0 inline h-3.5 w-3.5 p-0 align-sub" /> Reset
          </span>
        </Button>
        <Button
          className="px-2 py-[1px] text-base rounded-[5px]"
          onClick={handleApplyChanges}
          disabled={!isChanged}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
