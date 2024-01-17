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
// import { Priority } from "@prisma/client";
import { priorityEnum, zodPriorityEnum } from "~/schema";
import clsx from "clsx";

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
  filterObject: {
    searchTerm: string;
    priority: string;
    country: string;
    exposure: string;
    phenomena: string[];
    time_range: {
      startDate: string;
      endDate: string;
    };
  };
  setFilterObject: Dispatch<
    SetStateAction<{
      searchTerm: string;
      priority: string;
      country: string;
      exposure: string;
      phenomena: string[];
      time_range: {
        startDate: string;
        endDate: string;
      };
    }>
  >;
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
  switchDisabled: boolean;
  showMap: boolean;
  setShowMap: Dispatch<SetStateAction<boolean>>;
  resetFilters: () => void;
};

export default function FiltersBar({
  phenomena,
  phenomenaState,
  setPhenomenaState,
  filterObject,
  setFilterObject,
  sortBy,
  setSortBy,
  switchDisabled,
  showMap,
  setShowMap,
  resetFilters,
}: FiltersBarProps) {
  const { t } = useTranslation("explore-campaigns");
  return (
    <div className="my-4 flex flex-col gap-2 md:flex-row md:justify-between md:gap-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex w-fit gap-2 " variant="outline" size={"lg"}>
            <AlertCircleIcon
              className={clsx("h-4 w-4", {
                "text-red-500":
                  filterObject.priority.toLowerCase() === "urgent",
                "text-yellow-500":
                  filterObject.priority.toLowerCase() === "high",
                "text-blue-500":
                  filterObject.priority.toLowerCase() === "medium",
                "text-green-500": filterObject.priority.toLowerCase() === "low",
              })}
            />
            {!filterObject.priority ? (
              <span>{t("priority")} </span>
            ) : (
              <span>{filterObject.priority}</span>
            )}
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuRadioGroup
            value={filterObject.priority as zodPriorityEnum}
            onValueChange={(e: zodPriorityEnum) =>
              setFilterObject({ ...filterObject, priority: e  })
            }
          >
            {Object.values(priorityEnum.enumValues).map((priority: zodPriorityEnum, index: number) => {
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
            {!sortBy ? <span>{t("sort by")}</span> : <span>{sortBy}</span>}

            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
            <DropdownMenuRadioItem value="dringlichkeit">
              {t("priority")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="erstelldatum">
              {t("creation date")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <FiltersModal
        filterObject={filterObject}
        setFilterObject={setFilterObject}
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
