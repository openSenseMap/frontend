import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { countryListAlpha2 } from "./all-countries-object";
import { CountryFlagIcon } from "~/components/ui/country-flag";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";

type CountryDropdownProps = {
  setCountry?: (country: string) => void;
};

export function CountryDropdown({ setCountry }: CountryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const countries = Object.values(countryListAlpha2);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full"
        >
          {value
            ? countries.find((country) => country === value)
            : "Select country..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-24">
              {Object.entries(countryListAlpha2).map(
                ([countryCode, countryName], index: number) => (
                  <CommandItem
                    id="country"
                    key={index}
                    onSelect={(currentValue) => {
                      setValue(countryName);
                      if (setCountry) {
                        setCountry(countryCode);
                      }
                      setOpen(false);
                    }}
                  >
                    <CountryFlagIcon
                      country={String(countryCode).toUpperCase()}
                    />
                    {countryName}
                  </CommandItem>
                )
              )}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
