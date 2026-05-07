/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#03060f',
          1: '#060b1c',
          2: '#0a1228',
          3: '#0f1c3a',
          4: '#142a55',
        },
        fg: {
          0: '#e6f6ff',
          1: '#9fc6e4',
          2: '#5d83a8',
          3: '#3a5572',
        },
        accent: {
          DEFAULT: '#00d4ff',
          hi: '#6ef2ff',
          lo: '#0089b8',
        },
        neon: {
          DEFAULT: '#00ff9d',
          hi: '#6effc1',
        },
        success: '#00ff9d',
        danger: '#ff3b6b',
        info: '#00d4ff',
        line: {
          1: 'rgba(0,212,255,0.08)',
          2: 'rgba(0,212,255,0.16)',
          3: 'rgba(0,212,255,0.28)',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0, 212, 255, 0.45), 0 0 28px rgba(0, 212, 255, 0.35)',
        'glow-green': '0 0 0 1px rgba(0, 255, 157, 0.4), 0 0 24px rgba(0, 255, 157, 0.3)',
        inset1: 'inset 0 1px 0 rgba(0, 212, 255, 0.10)',
        soft: '0 4px 16px rgba(0, 0, 0, 0.55), 0 1px 2px rgba(0, 0, 0, 0.4)',
        lift: '0 18px 48px rgba(0, 0, 0, 0.7), 0 2px 6px rgba(0, 0, 0, 0.5)',
        iso: '-8px 8px 0 rgba(0, 212, 255, 0.08), -16px 16px 0 rgba(0, 212, 255, 0.04), 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 212, 255, 0.18)',
      },
      keyframes: {
        pulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        cite: {
          '0%': { background: 'rgba(0, 255, 157, 0.20)' },
          '40%': { background: 'rgba(0, 255, 157, 0.65)' },
          '100%': { background: 'rgba(0, 255, 157, 0.20)' },
        },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.2' } },
        neonPulse: {
          '0%,100%': { boxShadow: '0 0 0 1px rgba(0, 212, 255, 0.4), 0 0 24px rgba(0, 212, 255, 0.25)' },
          '50%': { boxShadow: '0 0 0 1px rgba(0, 212, 255, 0.7), 0 0 36px rgba(0, 212, 255, 0.5)' },
        },
      },
      animation: {
        pulse: 'pulse 1.2s ease-in-out infinite',
        cite: 'cite 1.4s ease-out 1',
        blink: 'blink 1s ease-in-out infinite',
        'neon-pulse': 'neonPulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
