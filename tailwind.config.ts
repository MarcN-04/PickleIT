import type { Config } from "tailwindcss";

/**
 * PickleIT design tokens — light glassmorphism, airy/premium/calm.
 * Lime accent is intentionally NOT a general-purpose color; reserve it
 * (token `accent`) for selected states, wins, and the "up next" highlight.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary action — emerald gradient endpoints (white text on these).
        primary: {
          DEFAULT: "#149655",
          from: "#149655",
          to: "#0e7a44",
        },
        // Accent — bright lime (dark text on these). Use sparingly.
        accent: {
          DEFAULT: "#c4e637",
          from: "#c4e637",
          to: "#9bc416",
        },
        // Near-black-green primary text.
        ink: "#14291d",
        // Category badge tints (soft, calm, readable dark text).
        cat: {
          beginner: "#d9f2e1",
          beginnerInk: "#1f5b3a",
          intermediate: "#f6e9c8",
          intermediateInk: "#7a5a16",
          pro: "#cfe9e4",
          proInk: "#155e54",
        },
      },
      fontFamily: {
        // Loaded via next/font in app/layout.tsx -> exposed as CSS variables.
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        glass: "20px",
        "glass-lg": "28px",
      },
      boxShadow: {
        // Soft green-tinted glass shadow.
        glass: "0 10px 30px -8px rgba(20,150,85,0.18), 0 2px 8px -2px rgba(20,41,29,0.08)",
        "glass-lift": "0 18px 44px -10px rgba(20,150,85,0.28), 0 4px 12px -2px rgba(20,41,29,0.10)",
        // Colored glow for selected states.
        "glow-primary": "0 0 0 1px rgba(20,150,85,0.35), 0 8px 24px -4px rgba(20,150,85,0.40)",
        "glow-accent": "0 0 0 1px rgba(155,196,22,0.55), 0 8px 24px -4px rgba(196,230,55,0.55)",
      },
      transitionTimingFunction: {
        // Springy overshoot easing from the brief.
        overshoot: "cubic-bezier(.34,1.46,.5,1)",
      },
    },
  },
  plugins: [],
};

export default config;
