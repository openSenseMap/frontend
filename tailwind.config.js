/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      // that is animation class
      animation: {
        'fade-in-up': 'fade-in-up 1s ease-out',
      },
      // that is actual animation
      keyframes: {
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
      }
    },
  },
  plugins: [],
};
