import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/common/utils/object'
import { Row, RowCamelCase } from '@/common/utils/types'
import { DateTz, makeDateTz } from '@/common/utils/date'
import { formatISO } from 'date-fns'
import { Goal } from '@/models/goal'

export type GoalUpdate = GoalUpdateNormal | GoalUpdateStatusChange

export interface GoalUpdateNormal {
  id: number
  type: 'normal'
  sentiment: 'positive' | 'negative' | 'neutral'
  content: string
  isPinned: boolean
  createdAt: DateTz
}

export interface GoalUpdateStatusChange {
  id: number
  type: 'status_change'
  statusChange: 'completed' | 'abandoned' | 'delayed' | 'reopened'
  sentiment: 'positive' | 'negative' | 'neutral'
  content: string | null
  isPinned: boolean
  createdAt: DateTz
  relatedGoalId?: number
  relatedGoalName?: string
  relatedGoalStatus?: Goal['status']
}

export async function getGoalUpdates(db: SQLiteDatabase, goalId: number): Promise<GoalUpdate[]> {
  const rows = await db.getAllAsync<Row<GoalUpdate>>(
    `
      select goal_update.id,
             goal_update.type,
             goal_update.status_change,
             goal_update.sentiment,
             content,
             is_pinned,
             goal_update.created_at
      from goal_update
      where goal_id = $goalId
      order by goal_update.created_at desc
    `,
    { $goalId: goalId }
  )

  return rows.map(toCamelCase<RowCamelCase<GoalUpdate>>).map((u) => {
    const { createdAt, ...updateData } = u

    return {
      ...updateData,
      createdAt: makeDateTz(createdAt),
    }
  })
}

export async function getLtGoalUpdates(
  db: SQLiteDatabase,
  goalId: number,
  relatedGoals: number[]
): Promise<GoalUpdate[]> {
  const rows = await db.getAllAsync<Row<GoalUpdate>>(
    `
      select goal_update.id,
             goal_update.type,
             goal_update.status_change,
             goal_update.sentiment,
             content,
             is_pinned,
             goal_update.created_at,
             g.id     as related_goal_id,
             g.name   as related_goal_name,
             g.status as related_goal_status
      from goal_update
             left join goal g on (goal_update.goal_id = g.id and goal_update.goal_id <> ?)
      where goal_id = ?
         or (goal_id in (${Array.from({ length: relatedGoals.length }, () => '?').join(', ')})
        and goal_update.type == 'status_change')
      order by goal_update.created_at desc
    `,
    [goalId, goalId, ...relatedGoals]
  )

  return rows.map(toCamelCase<RowCamelCase<GoalUpdate>>).map((u) => {
    const { createdAt, ...updateData } = u

    return {
      ...updateData,
      createdAt: makeDateTz(createdAt),
    }
  })
}

export async function addGoalUpdate(
  db: SQLiteDatabase,
  goalId: number,
  { sentiment, content, isPinned, createdAt, ...goalUpdate }: GoalUpdate
) {
  await db.runAsync(
    `
    insert into goal_update(goal_id, type, sentiment, content, is_pinned, created_at, status_change)
    values ($goalId, $type, $sentiment, $content, $isPinned, $createdAt, $statusChange)
  `,
    {
      $goalId: goalId,
      $type: goalUpdate.type,
      $sentiment: sentiment,
      $content: content,
      $isPinned: isPinned,
      $createdAt: formatISO(createdAt.date),
      $statusChange: goalUpdate.type === 'status_change' ? goalUpdate.statusChange : null,
    }
  )
}

export type UpdateGoalUpdateParam = Pick<GoalUpdate, 'id' | 'content'>

export async function updateGoalUpdate(db: SQLiteDatabase, { id, content }: UpdateGoalUpdateParam) {
  await db.runAsync(
    `
      update goal_update
      set content = $content
      where id = $id
    `,
    {
      $id: id,
      $content: content,
    }
  )
}

export async function deleteGoalUpdate(db: SQLiteDatabase, id: number) {
  await db.runAsync(
    `
      delete
      from goal_update
      where id = $id
    `,
    {
      $id: id,
    }
  )
}
