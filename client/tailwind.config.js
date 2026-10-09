/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Government / AccessIQ brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1a56db',
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#1e3163',
          900: '#172554',
        },
        severity: {
          critical: '#dc2626',
          serious: '#ea580c',
          moderate: '#ca8a04',
          minor: '#2563eb',
        },
      },
    },
  },
  plugins: [],
};
