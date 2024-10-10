import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useLoaderData, useNavigate } from "@remix-run/react";
import type { loader } from "~/routes/explore";
import { useEffect, useState } from "react";
import { DeviceExposureZodEnum, DeviceStatusZodEnum } from "~/schema/enum";

export default function FilterVisualization() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const params = new URLSearchParams(data.filterParams);

  // Validate filter values using the predefined enums
  const isValidFilter = (key: string, value: string) => {
    switch (key) {
      case "exposure":
        return DeviceExposureZodEnum.safeParse(value).success;
      case "status":
        return DeviceStatusZodEnum.safeParse(value).success;
      default:
        return false; // Invalid key
    }
  };

  // Update the search params to remove invalid filters
  const cleanSearchParams = () => {
    let modified = false;
    const newParams = new URLSearchParams(params);

    params.forEach((value, key) => {
      const values = value.split(","); // Handle comma-separated values
      const validValues = values.filter((v) => isValidFilter(key, v));

      if (validValues.length === 0) {
        // Remove entire parameter if no valid values
        newParams.delete(key);
        modified = true;
      } else if (validValues.length !== values.length) {
        // Update the parameter with only valid values
        newParams.set(key, validValues.join(","));
        modified = true;
      }
    });

    if (modified) {
      // Update the URL without reloading the page
      navigate(`?${newParams.toString()}`, { replace: true });
    }
  };

  // Clean search params when the component mounts
  useEffect(() => {
    cleanSearchParams();
  }, []);

  // Group valid filters by key
  const groupedFilters: { [key: string]: string[] } = {};

  params.forEach((value, key) => {
    const values = value.split(",").filter((v) => isValidFilter(key, v));
    if (values.length > 0) {
      groupedFilters[key] = values; // Group valid values under the same key
    }
  });

  // State to track if the collapsible is open
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedState = localStorage.getItem("collapsibleOpen");
    const initialOpenState =
      storedState === null
        ? Object.keys(groupedFilters).length > 0
        : storedState === "true";
    setIsOpen(initialOpenState);
  }, [groupedFilters]);

  // Function to toggle collapsible state
  const toggleCollapsible = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem("collapsibleOpen", newState.toString());
  };

  // Don't render anything if there are no active valid filters
  if (Object.keys(groupedFilters).length === 0) {
    return null;
  }

  return (
    <div className="absolute pt-2 pointer-events-auto">
      <Collapsible
        open={isOpen}
        onOpenChange={toggleCollapsible} // Use the toggle function
      >
        <CollapsibleTrigger className="text-white">
          {isOpen ? <ChevronDown /> : <ChevronRight />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-2">
            {Object.entries(groupedFilters).map(([key, values]) => (
              <Badge
                key={key} // Unique key for each badge based on the key
                className="bg-light-green animate-pulse delay-0"
                variant="secondary"
              >
                {`${key}: ${values.join(", ")}`}{" "}
                {/* Displaying the key and combined values */}
              </Badge>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
