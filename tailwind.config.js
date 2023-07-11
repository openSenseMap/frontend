const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}", "components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    // shadcn container
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    colors: {
      // Color schem is defined in /styles/app.css
      transparent: "transparent",
      current: "currentColor",
      white: "var(--color-white)",
      black: "var(--color-black)",
      gray: {
        50: "var(--color-gray-50)",
        100: "var(--color-gray-100)",
        200: "var(--color-gray-200)",
        300: "var(--color-gray-300)",
        400: "var(--color-gray-400)",
        500: "var(--color-gray-500)",
        600: "var(--color-gray-600)",
        700: "var(--color-gray-700)",
        800: "var(--color-gray-800)",
        900: "var(--color-gray-900)",
      },
      slate: {
        50: "var(--color-slate-50)",
        100: "var(--color-slate-100)",
        200: "var(--color-slate-200)",
        300: "var(--color-slate-300)",
        400: "var(--color-slate-400)",
        500: "var(--color-slate-500)",
        600: "var(--color-slate-600)",
        700: "var(--color-slate-700)",
        800: "var(--color-slate-800)",
        900: "var(--color-slate-900)",
      },
      green: {
        100: "var(--color-green-100)",
        300: "var(--color-green-300)",
        500: "var(--color-green-500)",
        700: "var(--color-green-700)",
        900: "var(--color-green-900)",
      },
      blue: {
        100: "var(--color-blue-100)",
        300: "var(--color-blue-300)",
        500: "var(--color-blue-500)",
        700: "var(--color-blue-700)",
        900: "var(--color-blue-900)",
      },
      red: {
        500: "var(--color-red-500)",
      },
      orange: {
        500: "var(--color-orange-500)",
      },
      violet: {
        500: "var(--color-violet-500)",
      },
      yellow: {
        500: "var(--color-yellow-500)",
      },
      headerBorder: "var(--color-headerBorder)",
    },
    extend: {
      colors: {
        // shadcn colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      // shadcn brder radius
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Urbanist", ...defaultTheme.fontFamily.sans],
        serif: ["RobotoSlab", ...defaultTheme.fontFamily.serif],
        helvetica: ["Helvetica", "Arial", "sans-serif"],
      },
      keyframes: {
        sidebarOpen: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(O)" },
        },
        sidebarClose: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        contentShow: {
          from: { opacity: 0, transform: "translate(-50%, 0%) scale(0.5)" },
          to: { opacity: 1, transform: "translate(-50%, 0%) scale(1)" },
        },
        contentClose: {
          from: { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: 0, transform: "translate(-50%, -48%) scale(0.5)" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        // shadcn accordion animation
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 1s ease-out",
        sidebarOpen: "sidebarOpen 300ms ease-out",
        sidebarClose: "sidebarClose 300ms ease-out",
        contentShow: "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        contentClose: "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        // shadcn accordion animation
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
};
