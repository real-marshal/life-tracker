import { Goal } from '@/models/goal'

export const colors = {
  accent: '#A4EB1F',
  ltGoal: '#C333C1',
  currentGoal: '#33CBF5',
  delayedGoal: '#C9C191',
  positive: '#75FF4B',
  negative: '#FF4A4A',
  bg: '#000000',
  bgSecondary: '#222222',
  bgTertiary: '#444444',
  fg: '#ffffff',
  fgSecondary: '#a0a0a0',
}

export const borderRadius = 8

export const goalStatusColorMap: Record<Goal['status'], string> = {
  active: colors.currentGoal,
  delayed: colors.delayedGoal,
  completed: colors.positive,
  abandoned: colors.negative,
}
