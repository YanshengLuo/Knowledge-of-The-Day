/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        panel: '#f6f7f8',
        line: '#d7dde2',
        signal: '#006d77',
        accent: '#b23a48'
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 23, 23, 0.08)'
      }
    }
  },
  plugins: []
};
