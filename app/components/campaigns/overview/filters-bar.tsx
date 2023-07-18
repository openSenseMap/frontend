import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import FiltersModal from "./filters-modal";
import { Switch } from "~/components/ui/switch";
import {
  AlertCircleIcon,
  ArrowDownAZIcon,
  ChevronDown,
  FilterXIcon,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Priority } from "@prisma/client";

type FiltersBarProps = {
  phenomena: string[];
  phenomenaState: {
    [k: string]: any;
  };
  setPhenomenaState: Dispatch<
    SetStateAction<{
      [k: string]: any;
    }>
  >;
  exposure: string;
  setExposure: Dispatch<SetStateAction<string>>;
  urgency: string;
  setUrgency: Dispatch<SetStateAction<string>>;
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
  switchDisabled: boolean;
  showMap: boolean;
  setShowMap: Dispatch<SetStateAction<boolean>>;
  resetFilters: any;
};

export default function FiltersBar({
  phenomena,
  phenomenaState,
  setPhenomenaState,
  exposure,
  setExposure,
  urgency,
  setUrgency,
  sortBy,
  setSortBy,
  switchDisabled,
  showMap,
  setShowMap,
  resetFilters,
}: FiltersBarProps) {
  const { t } = useTranslation("overview");
  return (
    <div className="my-4 flex flex-row justify-between gap-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex w-fit gap-2 " variant="outline" size={"lg"}>
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
            {t("urgency")}{" "}
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuRadioGroup value={urgency} onValueChange={setUrgency}>
            {Object.keys(Priority).map((priority: string, index: number) => {
              return (
                <DropdownMenuRadioItem key={index} value={priority}>
                  {priority}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex w-fit gap-2" variant="outline" size={"lg"}>
            <ArrowDownAZIcon className="h-4 w-4" />
            {t("sort by")}

            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
            <DropdownMenuRadioItem value="dringlichkeit">
              {t("urgency")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="erstelldatum">
              {t("creation date")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <FiltersModal
        exposure={exposure}
        setExposure={setExposure}
        phenomena={phenomena}
        phenomenaState={phenomenaState}
        setPhenomenaState={setPhenomenaState}
      />
      <Button
        className="flex w-fit gap-2 "
        variant={"outline"}
        size={"lg"}
        onClick={resetFilters}
      >
        {t("reset filters")}

        <FilterXIcon className="h-4 w-4" />
      </Button>
      <div className="flex flex-col items-center justify-center">
        <span> {t("show map")}</span>
        <Switch
          id="showMapSwitch"
          disabled={switchDisabled}
          checked={showMap}
          onCheckedChange={() => setShowMap(!showMap)}
        />
      </div>
    </div>
  );
}
