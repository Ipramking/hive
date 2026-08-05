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
        // deep-space hive chrome — cooler, darker, more contrast
        ink: {
          950: '#07080b',
          900: '#0b0d12',
          850: '#101319',
          800: '#151922',
          700: '#1f2430',
          600: '#2b3040',
        },
        line: 'rgba(255,255,255,0.08)',
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
