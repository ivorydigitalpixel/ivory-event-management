import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./modules/**/*.{ts,tsx}"],
  theme: { extend: { colors: { navy: "#0B1526", gold: "#C9A96E", ivory: "#FAF7F0", charcoal: "#2B2B2B" } } },
  plugins: [],
};
export default config;
