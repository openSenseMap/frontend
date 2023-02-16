const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  darkMode: "class",
  theme: {
    colors: {
      // Color schem is defined in /styles/app.css
      transparent: "transparent",
      current: "currentColor",
      white: "var(--color-white)",
      black: "var(--color-black)",

      gray: {
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
        500: "var(--color-slate-500)",
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
    },
    extend: {
      fontFamily: {
        sans: ["Urbanist", ...defaultTheme.fontFamily.sans],
        serif: ["RobotoSlab", ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [],
};
