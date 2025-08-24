import { Goal } from '@/models/goal'
import { GoalUpdate } from '@/models/goalUpdate'

export const colors = {
  accent: '#A4EB1F',
  accentActive: '#4a641c',
  ltGoal: '#C333C1',
  ltGoalActive: '#5d185c',
  currentGoal: '#33CBF5',
  currentGoalActive: '#17586b',
  delayedGoal: '#C9C191',
  delayedGoalActive: '#7c7346',
  positive: '#75FF4B',
  positiveActive: '#3a931f',
  negative: '#FF4A4A',
  negativeActive: '#7e1b1b',
  bg: '#000000',
  bgSecondary: '#181818',
  bgTertiary: '#3b3b3b',
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

export const goalStatusActiveColorMap: Record<Goal['status'], string> = {
  active: colors.currentGoalActive,
  delayed: colors.delayedGoalActive,
  completed: colors.positiveActive,
  abandoned: colors.negativeActive,
}

export const goalUpdateColorMap: Record<GoalUpdate['sentiment'], string> = {
  positive: colors.positive,
  negative: colors.negative,
  neutral: colors.fg,
}

export function getGoalColor(status?: Goal['status'], isLongTerm?: boolean): string {
  return isLongTerm ? colors.ltGoal : goalStatusColorMap[status ?? 'active']
}
