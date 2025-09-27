/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind color utilities
        canvas: 'var(--bg-canvas)',

        // Keep the surface scale for backward compatibility
        surface: {
          DEFAULT: 'var(--bg-surface)',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },

        // Primary colors with scale
        primary: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: 'var(--brand)',
          600: 'var(--brand)',
          700: 'var(--brand-hover)',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        link: 'var(--link)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        error: 'var(--danger)',
        border: 'var(--border)',
        divider: 'var(--divider)',

        // Text colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },

        // Meta brand colors
        meta: {
          blue: 'var(--brand)',
          darkBlue: 'var(--brand-hover)',
          lightBlue: '#42a2f5',
          gray: {
            50: '#f8f9fa',
            100: '#e9ecef',
            200: '#dee2e6',
            300: '#ced4da',
            400: '#adb5bd',
            500: '#6c757d',
            600: '#495057',
            700: '#343a40',
            800: '#212529',
            900: '#000000',
          }
        }
      },

      borderRadius: {
        'card': 'var(--r-card)',
        'md': 'var(--r-md)',
        'pill': 'var(--r-pill)',
        // Legacy
        'meta': '8px',
        'meta-lg': '12px',
      },

      boxShadow: {
        '1': 'var(--sh-1)',
        '2': 'var(--sh-2)',
        // Legacy shadows
        'card': '0 6px 24px rgba(0,0,0,.08)',
        'elevated': '0 10px 40px rgba(0,0,0,.12)',
        'meta': '0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
      },

      fontSize: {
        '11': ['var(--fs-11)', 'var(--lh-14)'],
        '12': ['var(--fs-12)', 'var(--lh-18)'],
        '14': ['var(--fs-14)', 'var(--lh-20)'],
        '16': ['var(--fs-16)', 'var(--lh-22)'],
        '20': ['var(--fs-20)', 'var(--lh-28)'],
      },

      spacing: {
        'sp-2': 'var(--sp-2)',
        'sp-3': 'var(--sp-3)',
        'sp-4': 'var(--sp-4)',
        'sp-5': 'var(--sp-5)',
        'sp-6': 'var(--sp-6)',
      },

      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      }
    },
  },
  plugins: [],
}