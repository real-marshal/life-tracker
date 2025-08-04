// const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      accent: '#A4EB1F',
      ltGoal: '#C333C1',
      currentGoal: '#33CBF5',
      delayedGoal: '#C9C191',
      positive: '#75FF4B',
      negative: '#FF4A4A',
      bg: '#000000',
      bgSecondary: '#181818',
      bgTertiary: '#3b3b3b',
      fg: '#ffffff',
      fgSecondary: '#a0a0a0',
    },
  },
  plugins: [],
}
