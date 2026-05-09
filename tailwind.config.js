/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFFDF7',
        nero: '#1a1a1a',
        yolk: '#FFE156',
        teal: '#4ECDC4',
        coral: '#FF6B6B',
        sky: '#4D96FF',
        lilac: '#C084FC',
        amber: '#F59E0B',
        expense: '#FF6B6B',
        income: '#4ECDC4',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brutal: '3px 3px 0 rgba(26,26,26,0.15)',
        'brutal-sm': '1.5px 1.5px 0 rgba(26,26,26,0.12)',
        'brutal-lg': '4px 4px 0 rgba(26,26,26,0.18)',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
}
