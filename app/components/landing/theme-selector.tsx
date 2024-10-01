import { Moon, Sun } from "lucide-react";
import { Theme, useTheme } from "remix-themes";

export function ThemeSelector() {
  const [theme, setTheme] = useTheme();

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
    );
  };

  return (
    <>
      {theme == "light" ? (
        <Sun onClick={toggleTheme} className="cursor-pointer" />
      ) : (
        <Moon onClick={toggleTheme} className="cursor-pointer" />
      )}
    </>
  );
}
