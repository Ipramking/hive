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
        // mission-deck chrome — cool blue-black steel
        ink: {
          950: '#060709',
          900: '#090b11',
          850: '#0e1118',
          800: '#12151d',
          700: '#1b1f29',
          600: '#262b37',
        },
        line: 'rgba(150,170,210,0.12)',
        steel: {
          DEFAULT: '#8b95a7',
          bright: '#e7ecf3',
          dim: '#5b6472',
        },
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
