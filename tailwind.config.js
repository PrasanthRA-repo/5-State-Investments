/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Material Design 3 inspired palette. "brand" kept as an alias of
        // primary so any leftover className referencing the old brand-*
        // scale still resolves to the same indigo used everywhere else.
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
        tertiary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          900: '#581c87',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        surface: {
          light: '#ffffff',
          dim: '#f8fafc',
          container: '#f1f5f9',
          high: '#e2e8f0',
        },
      },
      boxShadow: {
        e1: '0 1px 2px 0 rgba(15, 23, 42, 0.06), 0 1px 3px 0 rgba(15, 23, 42, 0.08)',
        e2: '0 2px 6px -1px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
        e3: '0 6px 16px -4px rgba(15, 23, 42, 0.14), 0 3px 8px -2px rgba(15, 23, 42, 0.10)',
        e4: '0 12px 28px -6px rgba(15, 23, 42, 0.20), 0 6px 12px -4px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      transitionDuration: {
        250: '250ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
