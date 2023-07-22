import { Form, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "~/components/ui/switch";
import {
  AlertCircleIcon,
  ArrowDownAZIcon,
  ChevronDown,
  FilterXIcon,
} from "lucide-react";
import { Priority } from "@prisma/client";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import clsx from "clsx";
import FiltersModal from "./filters-modal";

type FilterProps = {
  switchDisabled: boolean;
  showMap: boolean;
  setShowMap: (e: boolean) => void;
  phenomena: string[];
};

export default function Filter({
  switchDisabled,
  showMap,
  setShowMap,
  phenomena,
}: FilterProps) {
  const { t } = useTranslation("overview");
  const [searchParams] = useSearchParams();
  const [phenomenaState, setPhenomenaState] = useState(
    Object.fromEntries(phenomena.map((p: string) => [p, false]))
  );
  const [filterObject, setFilterObject] = useState({
    searchTerm: "",
    priority: "",
    country: "",
    exposure: "",
    phenomena: [] as string[],
    time_range: {
      startDate: "",
      endDate: "",
    },
  });

  const [sortBy, setSortBy] = useState("updatedAt");
  return (
    <Form>
      <div className="mx-auto grid w-1/3 flex-wrap items-end justify-center gap-2 gap-x-4 gap-y-2 sm:flex">
        <input
          className="focus:ring-blue-400 flex-grow rounded-md border border-gray-300 px-4 py-2 text-center text-lg focus:border-transparent focus:outline-none focus:ring-2"
          type="text"
          name="search"
          id="search"
          defaultValue={searchParams.get("search") || ""}
          placeholder="Search campaigns"

          // THIS IS FOR CLIENT SIDE FILTERING ONLY //

          // value={filterObject.searchTerm}
          // onChange={(event) =>
          //   setFilterObject({
          //     ...filterObject,
          //     searchTerm: event.target.value,
          //   })
          // }
        />
        <Button type="submit" variant="destructive">
          Search{" "}
        </Button>
      </div>
      <div className="my-4 flex w-full flex-row justify-between gap-20">
        <input
          className="hidden"
          type="text"
          name="priority"
          id="priority"
          value={filterObject.priority}
        />
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
                  "text-green-500":
                    filterObject.priority.toLowerCase() === "low",
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
              value={filterObject.priority}
              onValueChange={(e) =>
                setFilterObject({ ...filterObject, priority: e })
              }
            >
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
        <input
          className="hidden"
          type="text"
          name="sortBy"
          id="sortBy"
          value={sortBy}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex w-fit gap-2" variant="outline" size={"lg"}>
              <ArrowDownAZIcon className="h-4 w-4" />
              <span>{t("sort by")}</span>

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
              <DropdownMenuRadioItem value="updatedAt">
                Updated At
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          className="hidden"
          name="country"
          id="country"
          value={filterObject.country}
        />
        <input
          className="hidden"
          name="exposure"
          id="exposure"
          value={filterObject.exposure}
        />
        <input
          className="hidden"
          name="phenomena"
          id="phenomena"
          value={JSON.stringify(filterObject.phenomena)}
        />
        <input
          className="hidden"
          name="startDate"
          id="startDate"
          value={filterObject.time_range.startDate}
        />
        <input
          className="hidden"
          name="endDate"
          id="endDate"
          value={filterObject.time_range.endDate}
        />
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
          onClick={() => {
            setFilterObject({
              searchTerm: "",
              priority: "",
              country: "",
              exposure: "",
              phenomena: [] as string[],
              time_range: {
                startDate: "",
                endDate: "",
              },
            });
            setSortBy("updatedAt");
          }}
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
    </Form>
  );
}
