/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#080b10',
          800: '#0d1117',
          700: '#161b22',
          600: '#1e2a3a',
        },
        teal: {
          DEFAULT: '#00f5d4',
          50: 'rgba(0, 245, 212, 0.05)',
          100: 'rgba(0, 245, 212, 0.1)',
        },
        blue: {
          DEFAULT: '#0ea5e9',
        },
      },
    },
  },
  plugins: [],
};
