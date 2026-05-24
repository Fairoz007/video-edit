/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          black: '#030304',
          surface: '#07080c',
          navy: '#0a0c12',
          panel: 'rgba(12, 14, 20, 0.72)',
          'panel-elevated': 'rgba(16, 18, 28, 0.88)',
          'panel-solid': '#0c0e14',
          border: 'rgba(255, 255, 255, 0.07)',
          'border-strong': 'rgba(255, 255, 255, 0.12)',
          'border-accent': 'rgba(124, 131, 245, 0.35)',
          'border-bright': 'rgba(139, 108, 246, 0.45)',
          accent: '#6366f1',
          purple: '#8b5cf6',
          blue: '#3b82f6',
          cyan: '#22d3ee',
          glow: '#a5b4fc',
          muted: '#64748b',
          text: '#f1f5f9',
          'text-secondary': '#94a3b8',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'label-sm': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em', fontWeight: '600' }],
        'label-md': ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      spacing: {
        panel: '1rem',
        'panel-lg': '1.25rem',
      },
      borderRadius: {
        studio: '12px',
        'studio-lg': '16px',
        'studio-xl': '20px',
      },
      backdropBlur: {
        glass: '20px',
        xl: '28px',
      },
      boxShadow: {
        glow: '0 0 32px rgba(99, 102, 241, 0.22), 0 0 64px rgba(139, 92, 246, 0.08)',
        'glow-sm': '0 0 16px rgba(99, 102, 241, 0.18)',
        'glow-blue': '0 0 24px rgba(59, 130, 246, 0.15)',
        panel:
          '0 8px 40px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 0 0 1px rgba(255, 255, 255, 0.04)',
        float:
          '0 16px 48px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
        card: '0 4px 20px rgba(0, 0, 0, 0.4)',
        neon: '0 0 20px rgba(124, 131, 245, 0.35), 0 4px 24px rgba(0, 0, 0, 0.4)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'mesh-cinematic':
          'radial-gradient(ellipse 80% 50% at 10% -10%, rgba(99, 102, 241, 0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.08), transparent 45%), radial-gradient(ellipse 40% 30% at 50% 100%, rgba(139, 92, 246, 0.06), transparent 50%)',
        'gradient-cinematic': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 42%, #3b82f6 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
        'track-video':
          'linear-gradient(90deg, rgba(67, 56, 202, 0.95) 0%, rgba(109, 40, 217, 0.9) 50%, rgba(79, 70, 229, 0.95) 100%)',
        'track-audio':
          'linear-gradient(90deg, rgba(14, 116, 144, 0.9) 0%, rgba(6, 182, 212, 0.85) 100%)',
        'track-narration':
          'linear-gradient(90deg, rgba(88, 28, 135, 0.9) 0%, rgba(126, 34, 206, 0.85) 100%)',
        'clip-shine': 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'float-orb': 'floatOrb 12s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 12px rgba(124, 131, 245, 0.2)' },
          '50%': { opacity: '1', boxShadow: '0 0 20px rgba(124, 131, 245, 0.4)' },
        },
        floatOrb: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(12px, -8px) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
