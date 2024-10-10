import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useLoaderData } from "@remix-run/react";
import type { loader } from "~/routes/explore";
import { useEffect, useState } from "react";

export default function FilterVisualization() {
  const data = useLoaderData<typeof loader>();
  const params = new URLSearchParams(data.filterParams);

  // Check if there are any active filters that aren't set to "all"
  const hasActiveFilters = Array.from(params.values()).some(
    (value) => value !== "all",
  );

  // State to track if the collapsible is open
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedState = localStorage.getItem("collapsibleOpen");
    const initialOpenState =
      storedState === null ? hasActiveFilters : storedState === "true";
    setIsOpen(initialOpenState);
  }, [hasActiveFilters]);

  // Function to toggle collapsible state
  const toggleCollapsible = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem("collapsibleOpen", newState.toString()); // Store the new state
  };

  // Don't render anything if there are no active filters
  if (!hasActiveFilters) {
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
            {
              // Render a badge for each filter that's not set to "all"
              Array.from(params.entries())
                .filter(([, value]) => value !== "all")
                .map(([key, value]) => (
                  <Badge
                    key={key}
                    className="bg-light-green animate-pulse"
                    variant="secondary"
                  >
                    {value}
                  </Badge>
                ))
            }
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
