import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/common/utils/object'
import { Row, RowCamelCase } from '@/common/utils/types'
import { GoalPreview } from '@/models/goal'
import { DateTz, makeDateTz } from '@/common/utils/date'
import { formatISO } from 'date-fns'

export interface GoalUpdate {
  id: number
  type: 'normal' | 'closing'
  sentiment: 'positive' | 'negative' | 'neutral'
  relatedGoal?: GoalPreview
  content: string
  isPinned: boolean
  createdAt: DateTz
}

export async function getGoalUpdates(db: SQLiteDatabase, goalId: number): Promise<GoalUpdate[]> {
  const rows = await db.getAllAsync<Row<GoalUpdate>>(
    `
      select goal_update.id,
             goal_update.type,
             goal_update.sentiment,
             case
               when goal.id is not null
                 then json_object('id', goal.id, 'name', goal.name)
               else null end as related_goal,
             content,
             is_pinned,
             goal_update.created_at
      from goal_update
             left join goal on related_goal = goal_id
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
      relatedGoal: updateData.relatedGoal ? JSON.parse(updateData.relatedGoal) : undefined,
    }
  })
}

export async function addGoalUpdate(
  db: SQLiteDatabase,
  goalId: number,
  { type, sentiment, content, isPinned, createdAt }: GoalUpdate
) {
  await db.runAsync(
    `
    insert into goal_update(goal_id, type, sentiment, content, is_pinned, created_at)
    values ($goalId, $type, $sentiment, $content, $isPinned, $createdAt)
  `,
    {
      $goalId: goalId,
      $type: type,
      $sentiment: sentiment,
      $content: content,
      $isPinned: isPinned,
      $createdAt: formatISO(createdAt.date),
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
