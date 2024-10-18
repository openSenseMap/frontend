"use client";

import { Moon, Sun } from "lucide-react";
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
      className="hover:bg-transparent dark:hover:text-white hover:text-black"
    >
      {isDark ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
    </Button>
  );
}
