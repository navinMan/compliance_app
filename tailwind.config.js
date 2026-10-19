/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0B0F14',
        card: '#131A22',
        border: '#1F2A36',
        accent: '#14B8A6',
        compliant: '#22C55E',
        highrisk: '#F59E0B',
        unacceptable: '#EF4444',
        unmeasured: '#6B7280'
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: [],
};
