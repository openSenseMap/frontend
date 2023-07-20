import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { CountryDropdown } from "./country-dropdown";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, FilterIcon } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Exposure } from "@prisma/client";
import { useTranslation } from "react-i18next";
import PhenomenaSelect from "../phenomena-select";

type FiltersModalProps = {
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
    urgency: string;
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
      urgency: string;
      country: string;
      exposure: string;
      phenomena: string[];
      time_range: {
        startDate: string;
        endDate: string;
      };
    }>
  >;
};

export default function FiltersModal({
  phenomena,
  phenomenaState,
  setPhenomenaState,
  filterObject,
  setFilterObject,
}: FiltersModalProps) {
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [phenomenaDropdown, setPhenomenaDropdownOpen] = useState(false);
  const [localFilterObject, setLocalFilterObject] = useState({
    country: "",
    exposure: "",
    phenomena: [""],
    time_range: {
      startDate: "",
      endDate: "",
    },
  });
  const { t } = useTranslation("campaign-filters-modal");

  return (
    <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
      <DialogTrigger>
        <Button variant="outline" className="flex w-fit gap-2">
          {t("more filters")} <FilterIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      {/* <DialogOverlay> */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("more filters")}</DialogTitle>
        </DialogHeader>
        <CountryDropdown
          setCountry={(e) =>
            setLocalFilterObject({ ...localFilterObject, country: e })
          }
        />
        <Select
          value={localFilterObject.exposure}
          onValueChange={(e) =>
            setLocalFilterObject({ ...localFilterObject, exposure: e })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t("exposures")}</SelectLabel>
              {Object.keys(Exposure).map((key: string) => {
                return (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
        <PhenomenaSelect phenomena={phenomena} />
        <DropdownMenu
          open={phenomenaDropdown}
          onOpenChange={setPhenomenaDropdownOpen}
          // modal={false}
        >
          <DropdownMenuTrigger asChild>
            <Button className="w-full truncate" variant="outline">
              {Object.keys(phenomenaState)
                .filter((key) => phenomenaState[key])
                .join(", ")}
              {Object.keys(phenomenaState).filter((key) => phenomenaState[key])
                .length > 0 ? (
                <></>
              ) : (
                <span>{t("phenomena")}</span>
              )}
              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <ScrollArea>
              {phenomena.map((p: any) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={p}
                    checked={phenomenaState[p]}
                    onCheckedChange={() => {
                      setPhenomenaState({
                        ...phenomenaState,
                        [p]: !phenomenaState[p],
                      });
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {p}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button className="w-full" variant="outline">
              <span>{t("organizations")}</span>
              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <p>TODO: Organizations here</p>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex justify-between">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              {t("start date")}
            </label>
            <input id="startDate" name="startDate" type="date" />
          </div>
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              {t("end date")}
            </label>
            <input id="endDate" name="endDate" type="date" />
          </div>
        </div>

        <DialogFooter className="flex w-full justify-between">
          <Button
            onClick={() => setMoreFiltersOpen(false)}
            variant="destructive"
            className="mr-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => {
              setFilterObject({
                ...filterObject,
                country: localFilterObject.country,
                exposure: localFilterObject.exposure,
              });
              setMoreFiltersOpen(false);
            }}
          >
            {t("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
      {/* </DialogOverlay> */}
    </Dialog>
  );
}
