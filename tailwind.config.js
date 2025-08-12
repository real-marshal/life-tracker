// const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      accent: '#A4EB1F',
      accentActive: '#4a641c',
      ltGoal: '#C333C1',
      ltGoalActive: '#5d185c',
      currentGoal: '#33CBF5',
      currentGoalActive: '#17586b',
      delayedGoal: '#C9C191',
      positive: '#75FF4B',
      positiveActive: '#3a931f',
      negative: '#FF4A4A',
      negativeActive: '#7e1b1b',
      bg: '#000000',
      bgSecondary: '#181818',
      bgTertiary: '#3b3b3b',
      fg: '#ffffff',
      fgSecondary: '#a0a0a0',
    },
  },
  plugins: [],
}
