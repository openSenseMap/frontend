import * as SelectPrimitive from "@radix-ui/react-select";
import { Filter } from "lucide-react";
import { useSearchParams, useSubmit } from "react-router";
import { Badge } from "./ui/badge";

import { Select, SelectContent, SelectItem } from "./ui/select";
import { Separator } from "./ui/separator";

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

  const aggregationParam = searchParams.get("aggregation") || "raw";
  const selectedAggregation = aggregations.find(
    (aggregation) => aggregation.value === aggregationParam,
  );

  return (
    <Select
      value={selectedAggregation?.value}
      onValueChange={(value) => {
        searchParams.set("aggregation", value);
        void submit(searchParams);
      }}
    >
      <SelectPrimitive.Trigger
        className={
          "flex h-10 w-full items-center justify-between bg-transparent px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400"
        }
      >
        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 h-8 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 ">
          <Filter className="mr-2 h-4 w-4" />
          Aggregation
          <>
            <Separator orientation="vertical" className="mx-2 h4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selectedAggregation?.label}
            </Badge>
          </>
        </div>
      </SelectPrimitive.Trigger>
      <SelectContent>
        {aggregations.map((aggregation) => (
          <SelectItem key={aggregation.value} value={aggregation.value}>
            {aggregation.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
