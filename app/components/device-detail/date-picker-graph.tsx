"use client";

import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import type { loader } from "~/routes/explore/$deviceId";
import { PopoverClose } from "@radix-ui/react-popover";

export default function DatePickerGraph() {
  // Get data from the loader
  const loaderData = useLoaderData<typeof loader>();

  // Form submission handler
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  // State for selected date range and aggregation
  const [date, setDate] = useState<DateRange | undefined>({
    from: loaderData.fromDate ? new Date(loaderData.fromDate) : undefined,
    to: loaderData.toDate ? new Date(loaderData.toDate) : undefined,
  });

  if (
    !date?.from &&
    !date?.to &&
    loaderData.selectedSensors[0].data.length > 0
  ) {
    // on initial load, without a selected time range, check what time rage the last 20000 data points are in
    const firstDate = loaderData.selectedSensors[0].data[0].time;
    const lastDate =
      loaderData.selectedSensors[0].data[
        loaderData.selectedSensors[0].data.length - 1
      ].time;
    setDate({
      from: lastDate ? new Date(lastDate) : undefined,
      to: firstDate ? new Date(firstDate) : undefined,
    });
  }

  // Update search params when date or aggregation changes
  useEffect(() => {
    if (date?.from) {
      searchParams.set("date_from", date?.from?.toDateString() ?? "");
    }
    if (date?.to) {
      searchParams.set("date_to", date?.to?.toDateString() ?? "");
    }
  }, [date, searchParams]);

  // Update date range when loader data changes (fromDate and toDate)
  useEffect(() => {
    setDate({
      from: loaderData.fromDate ? new Date(loaderData.fromDate) : undefined,
      to: loaderData.toDate ? new Date(loaderData.toDate) : undefined,
    });
  }, [loaderData]);

  return (
    <div className={cn("grid gap-2")}>
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start border text-left font-normal dark:border-zinc-700",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-auto flex-col items-center justify-center p-0"
          align="start"
        >
          {/* Calendar for selecting date range */}
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(dates) => {
              setDate(dates);
            }}
            numberOfMonths={1}
            className="dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95"
          />
          <div className="flex w-full items-center justify-evenly py-2 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
            <PopoverClose
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => {
                submit(searchParams);
              }}
            >
              Submit
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
