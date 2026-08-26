/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488', // Teal-600 (PawMart primary branding)
          light: '#14B8A6',
          dark: '#0F766E',
        },
        secondary: {
          DEFAULT: '#F59E0B', // Amber-500
          light: '#FBBF24',
          dark: '#D97706',
        },
        dark: '#111827',
        light: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
