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
  exposure: string;
  setExposure: Dispatch<SetStateAction<string>>;
};

export default function FiltersModal({
  phenomena,
  phenomenaState,
  setPhenomenaState,
  exposure,
  setExposure,
}: FiltersModalProps) {
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [phenomenaDropdown, setPhenomenaDropdownOpen] = useState(false);

  return (
    <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
      <DialogTrigger>
        <Button variant="outline" className="flex w-fit gap-2">
          More Filters <FilterIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      {/* <DialogOverlay> */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>More Filters</DialogTitle>
        </DialogHeader>
        <CountryDropdown />
        <Select value={exposure} onValueChange={setExposure}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Exposures</SelectLabel>
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
                <span>Phänomene</span>
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
              <span>Organizations</span>
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
              Start Date
            </label>
            <input id="startDate" name="startDate" type="date" />
          </div>
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input id="endDate" name="endDate" type="date" />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button>Cancel</Button>
          <Button
            onClick={() => {
              setMoreFiltersOpen(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
      {/* </DialogOverlay> */}
    </Dialog>
  );
}
