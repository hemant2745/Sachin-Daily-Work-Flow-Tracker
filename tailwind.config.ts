import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#09121B",
          900: "#0E1A26",
          800: "#142536", // Primary specified dark navy
          700: "#1D3248",
          600: "#27415D",
          500: "#36577B",
          400: "#50759E",
          300: "#7F9CBF",
          200: "#B6C9DE",
          100: "#E3EBF3",
          50: "#F2F6FA",
        },
        brand: {
          orange: "#FF7A00", // Primary specified orange
          hover: "#E86B00",
          light: "#FFF4EB",
          muted: "#FFA856",
        },
        surface: {
          light: "#F3F5F7", // Primary specified light gray
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        cardHover: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
        panel: "0 10px 25px -5px rgba(20, 37, 54, 0.15), 0 8px 10px -6px rgba(20, 37, 54, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
