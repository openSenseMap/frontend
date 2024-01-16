import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "i18next";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";

type Props = {
  phenomenaState: any;
  setPhenomenaState: any;
  openDropdown: any;
  setDropdownOpen: any;
  phenomena: any;
};

export default function PhenomenaDropdown({
  phenomenaState,
  setPhenomenaState,
  openDropdown,
  setDropdownOpen,
  phenomena,
}: Props) {
  return (
    <DropdownMenu
      open={openDropdown}
      onOpenChange={setDropdownOpen}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <Button className="w-full truncate" variant="outline">
          {Object.keys(phenomenaState)
            .filter((key) => phenomenaState[key])
            .join(", ")}
          {Object.keys(phenomenaState).filter((key) => phenomenaState[key])
            .length > 0 ? (
            <></>
          ) : (
            <span>{t("phenomena")}</span>
          )}
          <span className="text-red-500">&nbsp;*</span>
          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {phenomena.map((p: any) => {
          return (
            <DropdownMenuCheckboxItem
              key={p}
              checked={phenomenaState[p]}
              onCheckedChange={() => {
                setPhenomenaState({
                  ...phenomenaState,
                  [p]: !phenomenaState[p],
                });
              }}
              onSelect={(event) => event.preventDefault()}
            >
              {p}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
