import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "rgb(var(--terminal-bg) / <alpha-value>)",
          panel: "rgb(var(--terminal-panel) / <alpha-value>)",
          "panel-dark": "rgb(var(--terminal-panel-dark) / <alpha-value>)",
          border: "rgb(var(--terminal-border) / <alpha-value>)",
          "border-light": "rgb(var(--terminal-border-light) / <alpha-value>)",
          amber: "rgb(var(--terminal-amber) / <alpha-value>)",
          "amber-dim": "rgb(var(--terminal-amber-dim) / <alpha-value>)",
          "amber-glow": "rgb(var(--terminal-amber) / 0.15)",
          green: "rgb(var(--terminal-green) / <alpha-value>)",
          "green-dim": "rgb(var(--terminal-green-dim) / <alpha-value>)",
          red: "rgb(var(--terminal-red) / <alpha-value>)",
          "red-dim": "rgb(var(--terminal-red-dim) / <alpha-value>)",
          white: "rgb(var(--terminal-white) / <alpha-value>)",
          "white-dim": "rgb(var(--terminal-white-dim) / <alpha-value>)",
          "white-faint": "rgb(var(--terminal-white-faint) / <alpha-value>)",
          blue: "rgb(var(--terminal-blue) / <alpha-value>)",
          cyan: "rgb(var(--terminal-cyan) / <alpha-value>)",
          yellow: "rgb(var(--terminal-yellow) / <alpha-value>)",
          purple: "rgb(var(--terminal-purple) / <alpha-value>)",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "blink": "blink 1s step-start infinite",
        "scroll-ticker": "scroll-ticker 40s linear infinite",
        "scan-line": "scan-line 6s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in-right 0.2s ease-out",
        "dropdown-in": "dropdown-in 0.15s ease-out",
        "led-pulse": "led-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "50.01%, 100%": { opacity: "0" },
        },
        "scroll-ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "scan-line": {
          "0%": { top: "-2%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { top: "102%", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(255, 176, 0, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(255, 176, 0, 0.6)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "dropdown-in": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "led-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.3" },
          "50%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
