// import type { Exposure, Priority } from "@prisma/client";
import { priorityEnum, exposureEnum } from "~/schema";
import clsx from "clsx";
import { ClockIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";

type PriorityBadgeProps = {
  priority: keyof typeof priorityEnum;
};

type ExposureBadgeProps = {
  exposure: keyof typeof exposureEnum;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const prio = priority.toString().toLowerCase();
  return (
    <Badge className="flex h-8 w-fit flex-wrap gap-1 rounded bg-muted px-2 py-1 text-sm text-black">
      <ClockIcon
        className={clsx("h-4 w-4", {
          "text-red-500": prio === "urgent",
          "text-yellow-500": prio === "high",
          "text-blue-500": prio === "medium",
          "text-green-500": prio === "low",
        })}
      />{" "}
      {prio}
    </Badge>
  );
}

export function ExposureBadge({ exposure }: ExposureBadgeProps) {
  const exposed = exposure.toString().toLowerCase();
  if (exposed === "unknown") {
    return null;
  }
  return (
    <Badge
      className={clsx(
        "h-8 w-fit rounded bg-muted px-2 py-1 text-sm text-black ",
        {
          // "bg-blue-200": exposed === "indoor",
          // "bg-orange-500": exposed === "mobile",
          // "bg-emerald-500": exposed === "outdoor",
        }
      )}
    >
      {exposed}
    </Badge>
  );
}
