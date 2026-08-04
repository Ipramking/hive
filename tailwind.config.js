/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // "the floor" — warm deep-slate chrome
        ink: {
          950: '#0c0d13',
          900: '#101119',
          850: '#151722',
          800: '#1a1c28',
          700: '#232636',
          600: '#2f3346',
        },
        line: 'rgba(236,232,222,0.10)',
        // "paper" — where deliverables land
        paper: {
          DEFAULT: '#f2ede1',
          dim: '#e5dece',
          ink: '#26221b',
          soft: '#6b6357',
          line: 'rgba(38,34,27,0.14)',
        },
        accent: {
          DEFAULT: '#6d7cff',
          soft: '#8b96ff',
          glow: 'rgba(109,124,255,0.35)',
        },
        hack: {
          DEFAULT: '#ff7a45',
          soft: '#ff9d6e',
        },
      },
      keyframes: {
        pulseSoft: {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        feed: {
          '0%': { transform: 'translateX(-2px)', opacity: '0.5' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 1.6s ease-in-out infinite',
        slideUp: 'slideUp 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
