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
        'contentShow': {
          'from': { opacity: 0, transform: 'translate(-50%, 0%) scale(0.5)' },
          'to': { opacity: 1, transform: 'translate(-50%, 0%) scale(1)' },
        },
        'contentClose': {
          'from': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
          'to': { opacity: 0, transform: 'translate(-50%, -48%) scale(0.5)' },
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
        'contentShow': 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'contentClose': 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)'
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
