import type { Exposure, Priority } from "@prisma/client";
import clsx from "clsx";
import { ClockIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";

type PriorityBadgeProps = {
  priority: keyof typeof Priority;
};

type ExposureBadgeProps = {
  exposure: keyof typeof Exposure;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const prio = priority.toString().toLowerCase();
  return (
    <Badge
      className={clsx(
        "flex w-fit flex-wrap gap-1 rounded px-2 py-1 text-sm text-white",
        {
          "bg-red-500": prio === "urgent",
          "bg-yellow-500": prio === "high",
          "bg-blue-500": prio === "medium",
          "bg-green-500": prio === "low",
        }
      )}
    >
      <ClockIcon className="h-4 w-4" /> {prio}
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
      className={clsx("ml-auto w-fit rounded px-2 py-1 text-sm text-white", {
        "bg-blue-200": exposed === "indoor",
        "bg-orange-500": exposed === "mobile",
        "bg-emerald-500": exposed === "outdoor",
      })}
    >
      {exposed}
    </Badge>
  );
}
