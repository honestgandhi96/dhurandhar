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
        terminal: {
          bg: "#0a0a0a",
          green: "#00ff41",
          dim: "#00aa2a",
          amber: "#ffaa00",
          danger: "#ff2020",
          border: "#1a2a1a",
        },
        dossier: {
          bg: "#e8dfc0",
          text: "#1a1208",
          border: "#c8b89a",
          stamp: "#cc1111",
        },
        whatsapp: "#25D366",
      },
      fontFamily: {
        mono: ["'Share Tech Mono'", "monospace"],
        heading: ["'Rajdhani'", "sans-serif"],
        typewriter: ["'Special Elite'", "serif"],
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.98" },
          "25%": { opacity: "0.96" },
          "75%": { opacity: "0.99" },
        },
        typewriter: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        stampSlam: {
          "0%": { transform: "rotate(-8deg) scale(3)", opacity: "0" },
          "50%": { transform: "rotate(-8deg) scale(1.1)", opacity: "0.9" },
          "100%": { transform: "rotate(-8deg) scale(1)", opacity: "0.85" },
        },
      },
      animation: {
        flicker: "flicker 8s infinite",
        typewriter: "typewriter 2s steps(40) forwards",
        shake: "shake 0.5s ease-in-out",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        stampSlam: "stampSlam 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
