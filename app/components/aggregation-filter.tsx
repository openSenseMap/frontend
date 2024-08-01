import { Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { useSearchParams, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";

type Aggregation = {
  value: string;
  label: string;
};

const aggregations: Aggregation[] = [
  {
    value: "raw",
    label: "Raw",
  },
  {
    value: "10m",
    label: "10 Minutes",
  },
  {
    value: "1h",
    label: "1 Hour",
  },
  {
    value: "1d",
    label: "1 Day",
  },
  {
    value: "1m",
    label: "1 Month",
  },
  {
    value: "1y",
    label: "1 Year",
  },
];

export function AggregationFilter() {
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const [open, setOpen] = useState(false);

  const aggregationParam = searchParams.get("aggregation") || "raw";
  const selectedAggregation = aggregations.find(
    (aggregation) => aggregation.value === aggregationParam,
  );

  // Shortcut to open aggregation selection
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h8 border-dashed"
          role="combobox"
          aria-expanded={open}
        >
          <Clock className="mr-2 h-4 w-4" />
          Aggregation
          <>
            <Separator orientation="vertical" className="mx-2 h4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selectedAggregation?.label}
            </Badge>
          </>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Change aggregation" />
          <CommandList>
            <CommandEmpty>No aggregation found.</CommandEmpty>
            <CommandGroup>
              {aggregations.map((aggregation) => (
                <CommandItem
                  key={aggregation.value}
                  value={aggregation.value}
                  onSelect={(value) => {
                    setOpen(false);
                    searchParams.set("aggregation", value);
                    submit(searchParams);
                  }}
                >
                  <span>{aggregation.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
