import { Theme, useTheme } from "~/utils/theme-provider";
import { Moon, Sun } from "lucide-react";

export default function ThemeSelector() {
  // Get the current theme from the `ThemeProvider` component.
  // This will be used to determine which icon to render.
  const [theme, setTheme] = useTheme();

  // Create a function to toggle the theme.
  // This function will set the theme to the opposite of the current theme.
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    );
  };

  // Return a `div` element with a button that toggles the theme.
  // The button will render the `MoonIcon` or the `SunIcon` depending on the current theme.
  return (
    <div className="flex items-center justify-center pr-8">
      <button onClick={toggleTheme}>
        {theme === "light" ? (
          <Moon className="h-6 w-6 text-gray-300 lg:h-8 lg:w-8" />
        ) : (
          <Sun className="h-6 w-6 text-white lg:h-8 lg:w-8" />
        )}
      </button>
    </div>
  );
}