/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          black: '#050508',
          navy: '#0a0e1a',
          panel: 'rgba(12, 14, 24, 0.65)',
          'panel-solid': '#0f1119',
          border: 'rgba(139, 92, 246, 0.12)',
          'border-bright': 'rgba(99, 102, 241, 0.35)',
          accent: '#6366f1',
          purple: '#a855f7',
          blue: '#3b82f6',
          cyan: '#22d3ee',
          glow: '#818cf8',
          magenta: '#e879f9',
          orange: '#fb923c',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        glass: '20px',
        xl: '32px',
      },
      boxShadow: {
        glow: '0 0 32px rgba(99, 102, 241, 0.35)',
        'glow-sm': '0 0 16px rgba(139, 92, 246, 0.25)',
        'glow-purple': '0 0 40px rgba(168, 85, 247, 0.3)',
        'glow-blue': '0 0 40px rgba(59, 130, 246, 0.25)',
        panel: '0 12px 48px rgba(0, 0, 0, 0.55), 0 0 1px rgba(139, 92, 246, 0.15)',
        float: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'mesh-cinematic':
          'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99, 102, 241, 0.18), transparent 50%), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(168, 85, 247, 0.12), transparent 45%), radial-gradient(ellipse 50% 30% at 50% 100%, rgba(59, 130, 246, 0.08), transparent 50%)',
        'gradient-cinematic': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)',
        'gradient-glow': 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15), rgba(59,130,246,0.1))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
