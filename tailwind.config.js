/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
        },
        coral: {
          DEFAULT: '#F97066',
          light: '#FCA5A1',
          dark: '#E5453A',
        },
        warm: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0F0E0D',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
        'card': '0 4px 12px rgba(28, 25, 23, 0.05), 0 1px 3px rgba(28, 25, 23, 0.04)',
        'elevated': '0 12px 32px rgba(28, 25, 23, 0.08), 0 4px 8px rgba(28, 25, 23, 0.04)',
        'float': '0 20px 48px rgba(28, 25, 23, 0.1), 0 8px 16px rgba(28, 25, 23, 0.06)',
        'glow': '0 0 24px rgba(16, 185, 129, 0.2)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        softPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
        'fade-in-up': 'fadeInUp 0.5s ease forwards',
        'soft-pulse': 'softPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
