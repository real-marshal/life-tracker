import { Goal } from '@/models/goal'

export const progressTextMap: Record<Goal['status'], [string, string]> = {
  active: ['In progress for ', ' since '],
  delayed: ['In progress for ', ' since '],
  completed: ['Completed in ', ', started '],
  abandoned: ['Abandoned after ', ', started '],
}

export const NEW_ID = -1
