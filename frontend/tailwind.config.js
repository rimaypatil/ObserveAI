/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdeff',
          300: '#8ec8ff',
          400: '#59a6ff',
          500: '#1976D2', // Primary
          600: '#1565C0',
          700: '#0d47a1',
          800: '#103d80',
          900: '#133568',
        },
        accent: {
          50: '#e6f7f5',
          500: '#00796B', // Secondary
          600: '#00695C',
        },
        severity: {
          p0: '#D32F2F', // Critical Red
          p1: '#F57C00', // High Orange
          p2: '#FBC02D', // Medium Yellow
          p3: '#1976D2', // Low Blue
        },
        dark: {
          bg: '#0F172A',
          surface: '#1E293B',
          card: '#1E293B',
          border: '#334155',
          hover: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
