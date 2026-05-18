/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          black: '#0a0a0f',
          panel: 'rgba(18, 18, 28, 0.72)',
          border: 'rgba(99, 102, 241, 0.15)',
          accent: '#6366f1',
          purple: '#8b5cf6',
          glow: '#818cf8',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(99, 102, 241, 0.25)',
        panel: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
