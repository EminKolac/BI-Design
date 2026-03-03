/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bist: {
          bg: '#0a0e17',
          card: '#111827',
          cardHover: '#1a2332',
          border: '#1e293b',
          borderLight: '#334155',
          primary: '#3b82f6',
          primaryDark: '#2563eb',
          accent: '#8b5cf6',
          green: '#10b981',
          greenBg: 'rgba(16, 185, 129, 0.1)',
          red: '#ef4444',
          redBg: 'rgba(239, 68, 68, 0.1)',
          yellow: '#f59e0b',
          yellowBg: 'rgba(245, 158, 11, 0.1)',
          text: '#f8fafc',
          textSecondary: '#94a3b8',
          textMuted: '#64748b',
          gold: '#C4A35A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
