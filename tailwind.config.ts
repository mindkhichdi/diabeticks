
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#FAFAFA",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#009688", // Teal for primary actions
          dark: "#00796B",    // Darker teal
          light: "#B2DFDB",   // Light teal
        },
        glucose: {
          normal: "#AED581",  // Light Green
          elevated: "#FF7043", // Coral
          low: "#42A5F5",     // Soft Blue
        },
        alert: {
          critical: "#FF7043", // Coral
          warning: "#FFEB3B",  // Sunny Yellow
        },
        chart: {
          primary: "#009688", // Teal
          secondary: "#CE93D8", // Lavender
          healthy: "#AED581",   // Light Green
          risk: "#FF7043",      // Coral
        },
        diabetic: {
          morning: "#FFB84C",
          afternoon: "#F16767",
          night: "#7286D3",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
