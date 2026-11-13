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
        brand: {
          plum: '#4A154B',
          'plum-dark': '#320B33',
          'plum-light': '#6B21A8',
          'plum-subtle': '#FAF5FA',
          gold: '#C59A3F',
          'gold-light': '#FDF9F0',
        },
        surface: {
          ivory: '#FAF9F6',
          warm: '#F4F2EC',
          card: '#FFFFFF',
          border: '#E8E5DF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

