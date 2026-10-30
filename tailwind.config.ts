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
          950: "#001A3D", // Deep Navy
          900: "#061B3D", // Navy
          800: "#0A2454", // Primary specified text navy
          700: "#133166",
          600: "#1E427B",
          500: "#2B5697",
          400: "#4D77B8",
          300: "#7CA1D8",
          200: "#B9CEF2",
          100: "#DFEAFE", // Fine Border
          50: "#F3F8FF",  // Main Background
        },
        brand: {
          orange: "#FF8A00", // Vibrant Orange
          hover: "#E67A00",
          light: "#FFF4EB",
          muted: "#FFA856",
        },
        royal: {
          DEFAULT: "#0866F5", // Royal Blue
          50: "#EBF3FF",
          100: "#D6E6FF",
          200: "#ADD0FF",
          300: "#70AAFF",
          400: "#3888FF",
          500: "#0866F5", // Royal Blue
          600: "#1677FF", // Bright Blue
          700: "#0047C7",
        },
        cyan: {
          DEFAULT: "#18B9E8",
          400: "#33CCF5",
          500: "#18B9E8",
        },
        accent: {
          navy: "#061B3D",
          deepNavy: "#001A3D",
          royal: "#0866F5",
          brightBlue: "#1677FF",
          cyan: "#18B9E8",
          orange: "#FF8A00",
          bg: "#F3F8FF",
          border: "#DFEAFE",
          text: "#0A2454",
          muted: "#61789E",
          success: "#00A77B",
          warning: "#FF9F1C",
          danger: "#F04460",
        },
        surface: {
          light: "#F3F8FF", // Primary background
          card: "#FFFFFF",
          border: "#DFEAFE", // Fine border
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
