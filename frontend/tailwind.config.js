/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Sora'", "sans-serif"],
      },
      colors: {
        navy: {
          50:  "#eff3fb",
          100: "#dce6f5",
          200: "#b9cde8",
          300: "#86a9d4",
          400: "#5681bc",
          500: "#3462a3",
          600: "#254b88",
          700: "#1d3b6e",
          800: "#172f58",
          900: "#112244",
          950: "#0b1730",
        },
        brand: {
          DEFAULT: "#1D4ED8",
          light:   "#3B82F6",
          dark:    "#1E3A8A",
        }
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease both",
        "fade-in":   "fadeIn 0.4s ease both",
        "slide-in":  "slideIn 0.4s ease both",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideIn: {
          "0%":   { opacity: 0, transform: "translateX(-16px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
      },
      boxShadow: {
        card:   "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 8px 24px 0 rgb(0 0 0 / 0.10)",
        glow:   "0 0 0 3px rgb(59 130 246 / 0.2)",
      }
    },
  },
  plugins: [],
}
