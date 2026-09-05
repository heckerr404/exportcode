/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      colors: {
        warm: {
          bg: '#f1ede7',
          50: '#faf8f5',
          100: '#f5f1eb',
          200: '#ece5db',
          300: '#ded4c5',
        },
        charcoal: {
          900: '#181622',
          800: '#282433',
          700: '#464154',
          600: '#6d677d',
          500: '#8e889e',
          400: '#b4aec2',
          300: '#d5d0e0',
          100: '#f3f0f7',
        },
        brand: {
          50:  '#fff3f4',
          100: '#ffe4e7',
          200: '#ffccd3',
          300: '#ffa1b0',
          400: '#ff6984',
          500: '#f73b61',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        accent: {
          coral: '#ff7a6b',
          rose: '#ff5e91',
          violet: '#9c6eff',
          peach: '#fdb896',
          lavender: '#dfd2f7',
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft-float': '0 20px 40px -15px rgba(180, 160, 195, 0.22), 0 4px 14px -3px rgba(130, 110, 145, 0.08)',
        'soft-card': '0 12px 28px -10px rgba(175, 155, 190, 0.16), 0 2px 8px -2px rgba(120, 100, 135, 0.05)',
        'soft-glow': '0 8px 26px rgba(247, 59, 97, 0.28)',
        'orb': '0 10px 30px rgba(255, 110, 140, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
