/** @type {import('tailwindcss').Config} */

// Theme-aware colours backed by the CSS variables in src/assets/main.css.
// They switch automatically with the `dark` class, so no `dark:` variant is
// needed when you use them (bg-surface, text-ink, border-line, …).
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (preferred for new work) ──
        canvas: v('canvas'),
        surface: {
          DEFAULT: v('surface'),
          raised: v('surface-raised'),
          sunken: v('surface-sunken'),
          hover: v('surface-hover'),
          inverse: v('surface-inverse'),
        },
        line: {
          DEFAULT: v('line'),
          strong: v('line-strong'),
        },
        ink: {
          DEFAULT: v('ink'),
          secondary: v('ink-secondary'),
          muted: v('ink-muted'),
          inverse: v('ink-inverse'),
        },
        brand: {
          DEFAULT: v('brand'),
          strong: v('brand-strong'),
          hover: v('brand-hover'),
          soft: v('brand-soft'),
          muted: v('brand-muted'),
          text: v('brand-text'),
          on: v('on-brand'),
        },
        success: { DEFAULT: v('success'), soft: v('success-soft'), text: v('success-text'), line: v('success-line') },
        warning: { DEFAULT: v('warning'), soft: v('warning-soft'), text: v('warning-text'), line: v('warning-line') },
        danger: { DEFAULT: v('danger'), soft: v('danger-soft'), text: v('danger-text'), line: v('danger-line') },
        info: { DEFAULT: v('info'), soft: v('info-soft'), text: v('info-text'), line: v('info-line') },
        neutral: { DEFAULT: v('neutral'), soft: v('neutral-soft'), text: v('neutral-text'), line: v('neutral-line') },

        // ── Legacy scales (kept so existing classes keep working) ──
        primary: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          // 600+ shifted one step darker so emerald text and white-on-emerald
          // fills pass WCAG AA (600 = brand-strong #047857).
          600: '#047857',
          700: '#065F46',
          800: '#064E3B',
          900: '#022C22',
          950: '#011812',
        },
        accent: {
          DEFAULT: v('accent'),
          light: '#FCD34D',
          dark: '#B45309',
        },
        coral: {
          DEFAULT: v('coral'),
          light: '#FCA5A1',
          dark: '#B42318',
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
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Bricolage Grotesque', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        // Legacy names, now neutral and theme-aware
        soft: 'var(--shadow-sm)',
        card: 'var(--shadow-xs)',
        elevated: 'var(--shadow-lg)',
        float: 'var(--shadow-xl)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      zIndex: {
        sticky: '20',
        nav: '30',
        drawer: '40',
        modal: '50',
        toast: '60',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        softPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease forwards',
        'soft-pulse': 'softPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
