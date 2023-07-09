import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

type ThemeContextType = [Theme | null, Dispatch<SetStateAction<Theme | null>>];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Update the stored theme preference when it changes
  useEffect(() => {
    if (theme) {
      const cookieValue = encodeURIComponent(theme);
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // Expires in 7 days
      const cookieString = `theme=${cookieValue}; expires=${expires.toUTCString()}; path=/`;
      document.cookie = cookieString;
    }
  }, [theme]);

  // Hydrate the client-side state with the stored theme preference
  useEffect(() => {
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (name === "theme") {
        const decodedValue = decodeURIComponent(value);
        setTheme(decodedValue as Theme);
        break;
      }
    }
  }, []);

  return (
    <ThemeContext.Provider value={[theme, setTheme]}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { Theme, ThemeProvider, useTheme };
