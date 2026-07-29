import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1F3A",
        foreground: "#FFFFFF",
        gray: { DEFAULT: "#F5F7FA", 900: "#1a2a40", 800: "#1e3150", 700: "#243a5e", 600: "#8899aa" },
        accent: { DEFAULT: "#00A86B", dark: "#008f59", light: "#00c47d" },
        border: "#243a5e",
        card: "#0f2644",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "dash": "dash 20s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        dash: {
          to: { strokeDashoffset: "-1000" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
