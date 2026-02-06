import { PopoverClose } from "@radix-ui/react-popover";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import  { type DateRange } from "react-day-picker";
import { useLoaderData, useSearchParams, useSubmit } from "react-router";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import dateTimeRanges from "~/lib/date-ranges";
import  { type loader } from "~/routes/explore.$deviceId.$sensorId.$";

export function DateRangeFilter() {
  // Get data from the loader
  const loaderData = useLoaderData<typeof loader>();

  // Form submission handler
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const [open, setOpen] = useState(false);

  // State for selected date range and aggregation
  const [date, setDate] = useState<DateRange | undefined>({
    from: loaderData.startDate ? new Date(loaderData.startDate) : undefined,
    to: loaderData.endDate ? new Date(loaderData.endDate) : undefined,
  });

  if (
    !date?.from &&
    !date?.to &&
    loaderData.sensors &&
    loaderData.sensors.length > 0 &&
    loaderData.sensors[0].data &&
    loaderData.sensors[0].data.length > 0
  ) {
    const firstDate = loaderData.sensors[0].data[0]?.time;
    const lastDate =
      loaderData.sensors[0].data[loaderData.sensors[0].data.length - 1]?.time;

    setDate({
      from: lastDate ? new Date(lastDate) : undefined,
      to: firstDate ? new Date(firstDate) : undefined,
    });
  }

  // Shortcut to open date range selection
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
    };
  }, []);

  // Update search params when date or aggregation changes
  useEffect(() => {
    if (date?.from) {
      searchParams.set("date_from", date?.from?.toISOString() ?? "");
    }
    if (date?.to) {
      searchParams.set("date_to", date?.to?.toISOString() ?? "");
    }
  }, [date, searchParams]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Clock className="mr-2 h-4 w-4" />
          Time Range
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "PPpp")} - {format(date.to, "PPpp")}
                  </>
                ) : (
                  format(date.from, "PPpp")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Badge>
          </>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-[500px] p-0"
        align="start"
        side="bottom"
      >
        <div className="flex flex-col dark:bg-dark-background ring-1 dark:ring-white rounded">
          <div className="flex">
            <div className="flex flex-col">
              <div className="flex justify-around items-center h-11 border-b">
                Absolute time range
              </div>
              <Calendar
                mode="range"
                selected={date}
                onSelect={(dates) => {
                  setDate(dates);
                }}
                initialFocus
              />
            </div>
            <Separator orientation="vertical" className="mx-4"></Separator>
            <Command>
              <CommandInput placeholder="Search quick ranges" />
              <CommandList>
                <CommandEmpty>No range found.</CommandEmpty>
                <CommandGroup>
                  {dateTimeRanges.map((dateTimeRange) => (
                    <CommandItem
                      key={dateTimeRange.value}
                      value={dateTimeRange.value}
                      onSelect={(value) => {
                        const selectedDateTimeRange = dateTimeRanges.find(
                          (range) => range.value === value,
                        );

                        const timeRange = selectedDateTimeRange?.convert();

                        setDate({
                          from: timeRange?.from,
                          to: timeRange?.to,
                        });
                      }}
                    >
                      <span>{dateTimeRange.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
          <div className="flex w-full items-center justify-evenly py-2 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
            <PopoverClose
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => {
                void submit(searchParams);
              }}
            >
              Apply
            </PopoverClose>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
