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
      },
      green: {
        100: "var(--color-green-100)",
        200: "var(--color-green-200)",
      },
      blue: {
        100: "var(--color-blue-100)",
        200: "var(--color-blue-200)",
      },
      headerBorder: "var(--color-headerBorder)"
    },
    extend: {
      fontFamily: {
        sans: ["Urbanist", ...defaultTheme.fontFamily.sans],
        serif: ["RobotoSlab", ...defaultTheme.fontFamily.serif],
      },
      keyframes: {
        'sidebarOpen': {
          'from': { transform: "translateX(100%)" },
          'to': { transform: "translateX(O)" },
        },
        'sidebarClose': {
          'from': { transform: "translateX(0)" },
          'to': { transform: "translateX(100%)" },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 1s ease-out',
        'sidebarOpen': 'sidebarOpen 300ms ease-out',
        'sidebarClose': 'sidebarClose 300ms ease-out',
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
