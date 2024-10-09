import {
  useSearchParams,
  useNavigation,
  useLoaderData,
} from "@remix-run/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import Spinner from "../../../spinner";
import type { loader } from "~/routes/explore";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import type { zodExposureEnum, zodStatusEnum } from "~/schema/enum";

export default function FilterOptions() {
  const data = useLoaderData<typeof loader>();
  //* searchParams hook
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  //* Set initial filter params based on url Search Params
  const [exposureVal, setExposureVal] = useState<zodExposureEnum>(
    (searchParams.get("exposure") as zodExposureEnum) ??
      ("all" as zodExposureEnum),
  );
  const [statusVal, setStatusVal] = useState<zodStatusEnum>(
    (searchParams.get("status") as zodStatusEnum) ??
      ("active" as zodStatusEnum),
  );

  //* Update filter params based on url Search Params
  useEffect(() => {
    setExposureVal(
      (searchParams.get("exposure") as zodExposureEnum) ??
        ("all" as zodExposureEnum),
    );
    setStatusVal(
      (searchParams.get("status") as zodStatusEnum) ??
        ("active" as zodStatusEnum),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
            value={exposureVal ? exposureVal.split(",") : ["all"]}
            onValueChange={(values: string[]) => {
              // If "all" is at index 0, remove "all" and keep other selections
              if (values.includes("all") && values.indexOf("all") === 0) {
                const filteredValues = values.filter(
                  (value) => value !== "all",
                );
                const valueString = filteredValues.join(",");
                setExposureVal(valueString as zodExposureEnum);
                searchParams.set("exposure", valueString);

                // If "all" is selected but not at index 0, deselect others and keep only "all"
              } else if (values.includes("all")) {
                setExposureVal("all");
                searchParams.set("exposure", "all");
              } else {
                // Normal behavior if "all" is not selected
                const valueString = values.join(",");
                setExposureVal(valueString as zodExposureEnum);
                searchParams.set("exposure", valueString);
              }

              setSearchParams(searchParams);
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
            value={statusVal ? statusVal.split(",") : ["active"]}
            onValueChange={(values: string[]) => {
              // If "all" is at index 0, remove "all" and keep other selections
              if (values.includes("all") && values.indexOf("all") === 0) {
                const filteredValues = values.filter(
                  (value) => value !== "all",
                );
                const valueString = filteredValues.join(",");
                searchParams.set("status", valueString);

                // If "all" is selected but not at index 0, deselect others and keep only "all"
              } else if (values.includes("all")) {
                searchParams.set("status", "all");
              } else {
                // Normal behavior if "all" is not selected
                const valueString = values.join(",");
                searchParams.set("status", valueString);
              }

              setSearchParams(searchParams);
            }}
          >
            <ToggleGroupItem value="all" aria-label="Toggle all">
              all
            </ToggleGroupItem>
            <ToggleGroupItem value="active" aria-label="Toggle indoor">
              active
            </ToggleGroupItem>
            <ToggleGroupItem value="inactive" aria-label="Toggle outdoor">
              inactive
            </ToggleGroupItem>
            <ToggleGroupItem value="old" aria-label="Toggle mobile">
              old
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="flex justify-between align-bottom">
        <Label className="rounded-[5px] border-[1px] border-[#e2e8f0] px-2 py-[1px] text-base leading-[2.2]">
          Results {data.filteredDevices.features.length}
        </Label>
        <Button
          variant="outline"
          className=" px-2 py-[1px] text-base rounded-[5px] border-[1px] border-[#e2e8f0]"
          onClick={() => {
            searchParams.set("exposure", "all");
            searchParams.set("status", "all");
            searchParams.delete("phenomenon");
            setSearchParams(searchParams);
          }}
        >
          <span className="flex items-center">
            <X className=" m-0 inline h-3.5 w-3.5 p-0 align-sub" /> Reset
            filters
          </span>
        </Button>
      </div>
    </div>
  );
}
