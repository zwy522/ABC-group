/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: "#4361ee",
        "primary-light": "#eef1ff",
        "primary-dark": "#3a56d4",
        accent: "#7c3aed",
        "accent-light": "#f3efff",
        surface: "#ffffff",
        "surface-alt": "#f8f9fc",
        "surface-warm": "#faf9f7",
        border: "#e5e7eb",
        "border-light": "#f0f1f3",
        heading: "#1a1a2e",
        body: "#374151",
        muted: "#6b7280",
        "muted-light": "#9ca3af",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },
      animation: {
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        "pulse-dot": "pulseDot 3s ease-in-out infinite",
        "bounce-slow": "bounce 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
