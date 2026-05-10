/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFFDF7',
        'cream-2': '#F6F1E1',
        nero: '#1a1a1a',
        yolk: '#FFE156',
        teal: '#4ECDC4',
        'teal-deep': '#2FA89F',
        coral: '#FF6B6B',
        sky: '#4D96FF',
        lilac: '#C084FC',
        amber: '#F59E0B',
        'amber-deep': '#D4922A',
        danger: '#E85D5D',
        'd-bg': '#13110C',
        'd-card': '#1F1B12',
        'd-line': 'rgba(255,255,255,0.06)',
        expense: '#FF6B6B',
        income: '#4ECDC4',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.4rem',
      },
      boxShadow: {
        brutal: '3px 3px 0 rgba(26,26,26,0.15)',
        'brutal-sm': '1.5px 1.5px 0 rgba(26,26,26,0.12)',
        'brutal-lg': '4px 4px 0 rgba(26,26,26,0.18)',
        soft: '0 1px 0 rgba(26,26,26,0.04), 0 8px 24px -12px rgba(26,26,26,0.10)',
        'soft-d': '0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
}
