import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        panel: "#f5f1e8",
        line: "#d8d0bf",
        brass: "#b58a3b",
        power: "#bd3f32",
        weak: "#256f8f",
        rail: "#4f5660"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(23, 32, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
