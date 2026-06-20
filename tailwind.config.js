/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B0B14",
        surface: "#13131F",
        glass: "rgba(255,255,255,0.04)",
        "glass-border": "rgba(255,255,255,0.08)",
        signal: {
          DEFAULT: "#7C5CFC",
          dim: "#5B3FE0",
          glow: "#9C84FF",
        },
        ember: {
          DEFAULT: "#FF6B6B",
          dim: "#E5484D",
        },
        mist: "#A0A3BD",
        paper: "#F4F3FA",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "orbit-a": {
          "0%": { transform: "rotate(0deg) translateX(11px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(11px) rotate(-360deg)" },
        },
        "orbit-b": {
          "0%": { transform: "rotate(180deg) translateX(11px) rotate(-180deg)" },
          "100%": { transform: "rotate(540deg) translateX(11px) rotate(-540deg)" },
        },
        dissolve: {
          "0%": { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
          "100%": { opacity: 0, filter: "blur(6px)", transform: "scale(0.92) translateY(-6px)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(124,92,252,0.45)" },
          "100%": { boxShadow: "0 0 0 16px rgba(124,92,252,0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "orbit-a": "orbit-a 3.2s linear infinite",
        "orbit-b": "orbit-b 3.2s linear infinite",
        dissolve: "dissolve 0.5s ease forwards",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
