import type { Device } from "~/schema";
import Search from "~/components/search";
import { Clock4Icon, Filter, IceCream2Icon, Tag } from "lucide-react";
import useKeyboardNav from "./use-keyboard-nav";
import { cn } from "~/lib/utils";
import FilterOptions from "./filter-options/filter-options";
// import { PhenomenonSelect } from "./phenomenon-select/phenomenon-select";
import FilterTags from "./filter-options/filter-tags";

interface NavBarHandlerProps {
  devices: Device[];
  searchString: string;
}

function getSections(devices: Device[]) {
  return [
    {
      title: "Filter",
      icon: Filter,
      color: "bg-blue-100",
      component: <FilterOptions />,
    },
    {
      title: "Tags",
      icon: Tag,
      color: "bg-light-green",
      component: <FilterTags />,
    },
    {
      title: "Date & Time",
      icon: Clock4Icon,
      color: "bg-gray-300",
      component: <div>Coming soon...</div>,
    },
    {
      title: "Phänomen",
      icon: IceCream2Icon,
      color: "bg-slate-500",
      component: <div>Coming soon...</div> //<PhenomenonSelect />,
    },
  ];
}

export default function NavbarHandler({
  devices,
  searchString,
}: NavBarHandlerProps) {
  const sections = getSections(devices);

  const { cursor, setCursor } = useKeyboardNav(0, 0, sections.length);

  if (searchString.length >= 2) {
    return <Search devices={devices} searchString={searchString} />;
  }

  return (
    <div className="mt-4 flex h-60 flex-col gap-4 md:flex-row">
      <div className="flex justify-around gap-2 md:h-full md:flex-1 md:flex-col">
        {sections.map((section, index) => (
          <div
            key={index}
            className={cn(
              `flex cursor-pointer items-center gap-4 rounded-full px-4 py-1 text-white hover:shadow-lg`,
              section.color,
              // disabled for now because ring looked weird
              // cursor === index && "ring-2 ring-slate-200 ring-offset-2",
              cursor !== index && "opacity-50",
            )}
            onClick={() => {
              setCursor(index);
            }}
          >
            <section.icon className="h-4 w-4" />
            <span className="hidden md:block">{section.title}</span>
          </div>
        ))}
      </div>
      <div className="flex-1">{sections[cursor].component}</div>
    </div>
  );
}
