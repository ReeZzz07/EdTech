/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: "var(--tg-theme-bg-color, #f4f4f5)",
          text: "var(--tg-theme-text-color, #18181b)",
          hint: "var(--tg-theme-hint-color, #71717a)",
          secondary: "var(--tg-theme-secondary-bg-color, #ffffff)",
          link: "var(--tg-theme-link-color, #2563eb)",
        },
      },
      borderColor: {
        tg: "color-mix(in srgb, var(--tg-theme-hint-color, #a1a1aa) 30%, transparent)",
      },
    },
  },
  plugins: [],
};
