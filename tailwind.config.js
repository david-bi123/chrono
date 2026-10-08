/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ChronoSwift brand blue — precision & signal */
        brand: {
          50: "#EEF3FF",
          100: "#DCE6FF",
          200: "#BDCEFF",
          300: "#94AAFF",
          400: "#6A87FF",
          500: "#4166F5",
          600: "#1F4FE0",
          700: "#1A40B8",
          800: "#1B3894",
          900: "#1C3374",
          950: "#131F45",
        },
        ink: {
          950: "#0B0F19",
          900: "#111827",
          700: "#374151",
          500: "#6B7280",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        soft: "var(--shadow-sm)",
        card: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lift: "var(--shadow-lg)",
        focus: "0 0 0 4px hsl(var(--primary) / 0.14)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pop: {
          // Keep in sync with globals.css: independent `scale` property so
          // the animation composes with translate utilities (see note there).
          "0%": { scale: "0.92", opacity: "0" },
          "100%": { scale: "1", opacity: "1" },
        },
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.21,0.9,0.35,1) both",
        "slide-in-right": "slide-in-right 0.25s cubic-bezier(0.21,0.9,0.35,1) both",
        pop: "pop 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
