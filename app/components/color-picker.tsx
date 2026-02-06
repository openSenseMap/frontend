"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ColorPicker({
  handleColorChange,
  colorPickerState,
  setColorPickerState,
}: {
  handleColorChange: (color: string, index: number) => void;
  colorPickerState: {
    open: boolean;
    index: number;
    color: string;
  };
  setColorPickerState: (state: {
    open: boolean;
    index: number;
    color: string;
  }) => void;
  className?: string;
}) {
  const solids = [
    "#E2E2E2",
    "#ff75c3",
    "#ffa647",
    "#ffe83f",
    "#9fff5b",
    "#70e2ff",
    "#cd93ff",
    "#09203f",
  ];

  function onClose() {
    setColorPickerState({ ...colorPickerState, open: false });
  }

  return (
    <div className="p-4 bg-background rounded-lg shadow-lg border w-72">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold">Choose or set a color</h4>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="grid grid-cols-8 gap-2 mb-4">
        {solids.map((color) => (
          <Button
            key={color}
            style={{ background: color }}
            className="w-6 h-6 rounded-md p-0 cursor-pointer hover:scale-110 transition-transform"
            onClick={() => {
              handleColorChange(color, colorPickerState.index);
              setColorPickerState({ ...colorPickerState, color });
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-md border"
          style={{ background: colorPickerState.color }}
        />
        <Input
          id="custom"
          value={colorPickerState.color}
          className="flex-grow"
          onChange={(e) => {
            handleColorChange(e.target.value, colorPickerState.index);
            setColorPickerState({ ...colorPickerState, color: e.target.value });
          }}
        />
      </div>
    </div>
  );
}
