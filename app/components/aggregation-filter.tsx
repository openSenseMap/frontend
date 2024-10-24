import { Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { useSearchParams, useSubmit } from "@remix-run/react";
import * as SelectPrimitive from "@radix-ui/react-select";

import { Select, SelectContent, SelectItem } from "./ui/select";

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
        submit(searchParams);
      }}
    >
      <SelectPrimitive.Trigger
        className={
          "flex h-10 w-full items-center justify-between bg-transparent px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400"
        }
      >
        <Button variant="outline" size="sm" className="h-8">
          <Filter className="mr-2 h-4 w-4" />
          Aggregation
          <>
            <Separator orientation="vertical" className="mx-2 h4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selectedAggregation?.label}
            </Badge>
          </>
        </Button>
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
