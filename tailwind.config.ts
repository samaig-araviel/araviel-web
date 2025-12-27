import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode colors (default)
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
        },
        glass: {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Menlo',
          'Consolas',
          'monospace',
        ],
        serif: [
          'Georgia',
          'Times New Roman',
          'serif',
        ],
      },
      fontSize: {
        '2xs': '0.625rem',
        xs: '0.6875rem',
        sm: '0.8125rem',
        base: '0.875rem',
        lg: '0.9375rem',
        xl: '1rem',
        '2xl': '1.125rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
        '5xl': '1.75rem',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '68': '17rem',
        '76': '19rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 8px 20px rgba(217, 120, 70, 0.3)',
        'glow-lg': '0 8px 24px rgba(217, 120, 70, 0.5)',
        'dropdown': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'dropdown-dark': '0 8px 24px rgba(0, 0, 0, 0.25)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.4)',
        'modal-light': '0 20px 60px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'slide-down': 'slideDown 0.2s ease',
        'slide-up': 'slideUp 0.2s ease',
        'slide-up-bottom': 'slideUpFromBottom 0.2s ease',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'source-menu': 'sourceMenuAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'profile-menu': 'profileMenuAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.2s ease',
        'fade-out': 'fadeOut 0.3s ease forwards',
        'slide-up-modal': 'slideUpModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'icon-pulse': 'iconPulse 2s ease-in-out infinite',
        'pulse-warn': 'pulseWarn 2s ease-in-out infinite',
      },
      keyframes: {
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUpFromBottom: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(8px)' },
          to: { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 8px 20px rgba(217, 120, 70, 0.3)' },
          '50%': { boxShadow: '0 8px 24px rgba(217, 120, 70, 0.5)' },
        },
        sourceMenuAppear: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(8px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' },
        },
        profileMenuAppear: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideUpModal: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        iconPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        pulseWarn: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(217, 120, 70, 0)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(217, 120, 70, 0.1)' },
        },
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
