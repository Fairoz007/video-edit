import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/editor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          black: '#030304',
          surface: '#08090c',
          navy: '#0c0e14',
          panel: 'rgba(14, 16, 22, 0.92)',
          'panel-elevated': '#12141c',
          'panel-solid': '#0e1016',
          border: 'rgba(255, 255, 255, 0.06)',
          'border-strong': 'rgba(255, 255, 255, 0.1)',
          'border-accent': 'rgba(99, 102, 241, 0.22)',
          accent: '#5b63f0',
          purple: '#8b6cf6',
          blue: '#3b82f6',
          cyan: '#38bdf8',
          glow: '#7c83f5',
          muted: '#6b7280',
          text: '#e8eaef',
          'text-secondary': '#9ca3af',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'label-sm': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        studio: '10px',
        'studio-lg': '14px',
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(91, 99, 240, 0.15)',
        'glow-sm': '0 0 8px rgba(91, 99, 240, 0.12)',
        panel: '0 4px 24px rgba(0, 0, 0, 0.45)',
        float: '0 8px 32px rgba(0, 0, 0, 0.5)',
        card: '0 2px 12px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'track-video': 'linear-gradient(90deg, #3730a3 0%, #5b21b6 100%)',
        'track-audio': 'linear-gradient(90deg, #1e3a5f 0%, #0e7490 100%)',
        'track-narration': 'linear-gradient(90deg, #4c1d95 0%, #6b21a8 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
