import { useSearchParams, useSubmit } from "@remix-run/react";
import { Badge } from "../ui/badge";
import { subDays } from "date-fns";

export default function FixedTimeRangeButtons() {
  // Form submission handler
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const isLast24Hours =
    searchParams.get("date_from") === subDays(new Date(), 1).toDateString() &&
    searchParams.get("date_to") === new Date().toDateString();

  const isLastWeek =
    searchParams.get("date_from") === subDays(new Date(), 7).toDateString() &&
    searchParams.get("date_to") === new Date().toDateString();

  const isLastMonth =
    searchParams.get("date_from") === subDays(new Date(), 30).toDateString() &&
    searchParams.get("date_to") === new Date().toDateString();

  function getLast24Hours() {
    searchParams.set("date_from", subDays(new Date(), 1).toDateString());
    searchParams.set("date_to", new Date().toDateString());

    submit(searchParams, {
      method: "get",
    });
  }

  function getLastWeek() {
    searchParams.set("date_from", subDays(new Date(), 7).toDateString());
    searchParams.set("date_to", new Date().toDateString());

    submit(searchParams, {
      method: "get",
    });
  }

  function getLastMonth() {
    searchParams.set("date_from", subDays(new Date(), 30).toDateString());
    searchParams.set("date_to", new Date().toDateString());

    submit(searchParams, {
      method: "get",
    });
  }

  return (
    <div className="hidden h-full cursor-pointer items-center justify-center gap-2 sm:flex">
      <Badge
        onClick={getLast24Hours}
        variant="outline"
        className={isLast24Hours ? "text-green-300 dark:text-green-300" : ""}
      >
        24 hours
      </Badge>
      <Badge
        onClick={getLastWeek}
        variant="outline"
        className={isLastWeek ? "text-green-300 dark:text-green-300" : ""}
      >
        1 week
      </Badge>
      <Badge
        onClick={getLastMonth}
        variant="outline"
        className={isLastMonth ? "text-green-300 dark:text-green-300" : ""}
      >
        1 month
      </Badge>
    </div>
  );
}
