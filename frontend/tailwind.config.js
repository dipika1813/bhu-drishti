/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "hud-bg": "#0a0e12",
        "hud-panel": "#0d1520",
        "hud-border": "#1a2535",
        "hud-cyan": "#00d9ff",
        "hud-amber": "#ffb020",
        "hud-green": "#39ff14",
        "hud-red": "#ff3b3b",
        "hud-text": "#c8d8e8",
        "hud-muted": "#4a6080",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        "scan-line": "scanLine 3s linear infinite",
        "radar-spin": "radarSpin 2s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "blink": "blink 1s step-end infinite",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)",
        "fade-in": "fadeIn 0.3s ease-out",
        "typewriter": "typewriter 0.05s steps(1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        radarSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 4px #00d9ff55" },
          "50%": { boxShadow: "0 0 16px #00d9ff" },
        },
      },
      boxShadow: {
        "hud": "0 0 20px rgba(0,217,255,0.1), inset 0 0 20px rgba(0,0,0,0.5)",
        "hud-strong": "0 0 30px rgba(0,217,255,0.3)",
        "amber": "0 0 20px rgba(255,176,32,0.2)",
      },
    },
  },
  plugins: [],
};
