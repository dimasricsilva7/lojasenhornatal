import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#14201A",
          900: "#1C2B23",
          800: "#2C3D33",
          700: "#43544A",
          600: "#5E6E64",
        },
        cream: {
          25: "#FFFDF9",
          50: "#FBF7EF",
          100: "#F4ECDD",
          200: "#EADCC2",
          300: "#D9C39C",
        },
        sage: {
          50: "#EEF5F0",
          100: "#D9EADF",
          200: "#B3D3BF",
          400: "#4F9A6E",
          500: "#2F7A52",
          600: "#1F5F3F",
          700: "#174A31",
        },
        clay: {
          50: "#FCEEEC",
          100: "#F7D6D1",
          400: "#D9584B",
          500: "#C2352A",
          600: "#A82820",
          700: "#86201A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(33, 30, 25, 0.08)",
        card: "0 2px 14px rgba(33, 30, 25, 0.06)",
        lift: "0 12px 32px rgba(33, 30, 25, 0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
