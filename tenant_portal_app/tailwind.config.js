const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Inter Fallback', 'sans-serif'],
      },
    },
  },
  darkMode: "class",
  plugins: [nextui({
    prefix: "nextui",
    addCommonColors: false,
    defaultTheme: "dark",
    defaultExtendTheme: "dark",
    layout: {
      spacingUnit: 4,
      disabledOpacity: 0.5,
      dividerWeight: "1px",
      fontSize: {
        tiny: "0.75rem",
        small: "0.875rem", 
        medium: "1rem",
        large: "1.125rem",
      },
      lineHeight: {
        tiny: "1rem",
        small: "1.25rem",
        medium: "1.5rem", 
        large: "1.75rem",
      },
      radius: {
        small: "8px",
        medium: "12px",
        large: "14px",
      },
      borderWidth: {
        small: "1px",
        medium: "2px",
        large: "3px",
      },
      boxShadow: {
        small: "0px 0px 5px 0px rgb(0 0 0/0.02),0px 2px 10px 0px rgb(0 0 0/0.06),0px 0px 1px 0px rgb(0 0 0/0.3)",
        medium: "0px 0px 15px 0px rgb(0 0 0/0.03),0px 2px 30px 0px rgb(0 0 0/0.08),0px 0px 1px 0px rgb(0 0 0/0.3)",
        large: "0px 0px 30px 0px rgb(0 0 0/0.04),0px 30px 60px 0px rgb(0 0 0/0.12),0px 0px 1px 0px rgb(0 0 0/0.3)",
      }
    },
    themes: {
      light: {
        colors: {
          background: "#FFFFFF",
          foreground: "#202324",
          primary: {
            50: "#eff6ff",
            100: "#dbeafe", 
            200: "#bfdbfe",
            300: "#93c5fd",
            400: "#60a5fa",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
            800: "#1e40af",  
            900: "#1e3a8a",
            DEFAULT: "#3b82f6",
            foreground: "#ffffff",
          },
          focus: "#3b82f6",
        },
      },
    },
  })],
}
