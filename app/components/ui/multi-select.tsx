//code from https://craft.mxkaske.dev/post/fancy-multi-select

import { X } from "lucide-react";
import * as React from "react";

import clsx from "clsx";
import { Command as CommandPrimitive } from "cmdk";
import { Badge } from "./badge";
import { Command, CommandGroup, CommandItem } from "./command";
import { Label } from "./label";
import { ScrollArea } from "./scroll-area";

type DataItem = Record<"value" | "label", string>;

export function MultiSelect({
  label,
  placeholder = "Select an item",
  parentClassName,
  data,
  setLocalFilterObject,
  localFilterObject,
  setSelectedPhenomena,
}: {
  label?: string;
  placeholder?: string;
  parentClassName?: string;
  data: DataItem[];
  setSelectedPhenomena: any;
  localFilterObject?: {
    country: string;
    exposure: string;
    phenomena: string[];
    time_range: {
      startDate: string;
      endDate: string;
    };
  };
  setLocalFilterObject?: React.Dispatch<
    React.SetStateAction<{
      country: string;
      exposure: string;
      phenomena: string[];
      time_range: {
        startDate: string;
        endDate: string;
      };
    }>
  >;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<DataItem[]>([]);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback((item: DataItem) => {
    setSelected((prev) => prev.filter((s) => s.value !== item.value));
  }, []);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            setSelected((prev) => {
              const newSelected = [...prev];
              newSelected.pop();
              return newSelected;
            });
          }
        }
        // This is not a default behaviour of the <input /> field
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    []
  );

  const selectables = data.filter((item) => !selected.includes(item));

  return (
    <div
      className={clsx(
        label && "gap-1.5",
        parentClassName,
        "grid w-full items-center"
      )}
    >
      {label && (
        <Label className="text-sm font-medium text-[#344054]">{label}</Label>
      )}
      <Command
        onKeyDown={handleKeyDown}
        className="overflow-visible bg-transparent"
      >
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1">
            {selected.map((item, index) => {
              if (index > 1) return null;
              return (
                <Badge key={item.value} variant="secondary">
                  {item.label}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              );
            })}
            {selected.length > 2 && <p>{`+${selected.length - 2} more`}</p>}
            {/* Avoid having the "Search" Icon */}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="ml-2 flex-1 border-none bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="relative mt-2">
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup>
                <ScrollArea className="h-24">
                  {selectables.map((framework) => {
                    return (
                      <CommandItem
                        key={framework.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onSelect={(value) => {
                          setInputValue("");
                          setSelected((prev) => [...prev, framework]);
                          if (localFilterObject && setLocalFilterObject) {
                            setLocalFilterObject({
                              ...localFilterObject,
                              phenomena: [
                                ...localFilterObject.phenomena,
                                framework.value,
                              ],
                            });
                          }
                          if (setSelectedPhenomena) {
                            setSelectedPhenomena((selected: any) => [
                              ...selected,
                              framework.value,
                            ]);
                          }
                        }}
                      >
                        {framework.label}
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </div>
          ) : null}
        </div>
      </Command>
    </div>
  );
}
