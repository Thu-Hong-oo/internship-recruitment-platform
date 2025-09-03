/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(0.55 0.18 195)',
          light: 'oklch(0.65 0.15 195)',
          dark: 'oklch(0.45 0.20 195)',
        },
        brand: {
          primary: 'oklch(0.55 0.18 195)',
          secondary: '#f0f2f5',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, oklch(0.55 0.18 195) 0%, oklch(0.65 0.15 195) 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, oklch(0.45 0.20 195) 0%, oklch(0.55 0.18 195) 100%)',
      }
    },
  },
  plugins: [],
}

