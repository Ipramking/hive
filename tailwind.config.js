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
        // nebula chrome — deep indigo glass on a blue-violet gradient
        ink: {
          950: '#080814',
          900: '#0c0c1c',
          850: '#12122a',
          800: '#181838',
          700: '#22224a',
          600: '#2e2e60',
        },
        line: 'rgba(160,162,240,0.14)',
        steel: {
          DEFAULT: '#9aa0c4',
          bright: '#eef0fb',
          dim: '#63678f',
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
          DEFAULT: '#6d5bff',
          soft: '#8f82ff',
          glow: 'rgba(109,91,255,0.42)',
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
