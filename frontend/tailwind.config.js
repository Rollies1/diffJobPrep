/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark palette
        'jp-indigo': '#0f0c29',
        'jp-midnight': '#24243e',
        'jp-accent': '#302b63',
        'jp-cyan': '#00d4ff',
        'jp-violet': '#7c3aed',
        'jp-rose': '#f43f5e',
        'jp-success': '#22c55e',
        'jp-glass-dark': 'rgba(255,255,255,0.03)',
        'jp-glass-dark-border': 'rgba(255,255,255,0.08)',
        // Light palette
        'jp-slate': '#f8fafc',
        'jp-cloud': '#e2e8f0',
        'jp-surface-light': '#f1f5f9',
        'jp-glass-light': 'rgba(255,255,255,0.7)',
        'jp-glass-light-border': 'rgba(0,0,0,0.05)',
        'jp-sky': '#0ea5e9',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'Inter_600SemiBold', 'Inter_700Bold'],
      },
      borderRadius: {
        'jp-sm': '12px',
        'jp-md': '16px',
        'jp-lg': '24px',
        'jp-xl': '32px',
      },
    },
  },
  plugins: [],
};
