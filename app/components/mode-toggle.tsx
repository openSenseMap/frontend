"use client";

import { Lightbulb } from "lucide-react";
import { Theme, useTheme } from "remix-themes";
import { Button } from "./ui/button";

export function ModeToggle() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === Theme.DARK;

  const toggleTheme = () => {
    setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Lightbulb
        className={`h-6 w-6 transition-colors ${
          isDark ? "text-yellow" : "text-gray-400"
        }`}
      />
    </Button>
  );
}
