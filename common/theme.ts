import { Goal } from '@/models/goal'
import { GoalUpdate } from '@/models/goalUpdate'

export const colors = {
  accent: '#A4EB1F',
  ltGoal: '#C333C1',
  currentGoal: '#33CBF5',
  delayedGoal: '#C9C191',
  positive: '#75FF4B',
  negative: '#FF4A4A',
  bg: '#000000',
  bgSecondary: '#181818',
  bgTertiary: '#383838',
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

export const goalUpdateColorMap: Record<GoalUpdate['sentiment'], string> = {
  positive: colors.positive,
  negative: colors.negative,
  neutral: colors.fg,
}
