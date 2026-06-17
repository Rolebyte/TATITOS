/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B9D',
        secondary: '#6C63FF',
        accent: '#FFD93D',
        dark: '#1A1A2E',
        light: '#FFF5F8',
        muted: '#6B7280',
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
