import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/common/utils/object'
import { Row } from '@/common/utils/types'
import { GoalPreview } from '@/models/goal'

interface GoalUpdate {
  id: number
  type: 'normal' | 'closing'
  sentiment: 'positive' | 'negative' | 'neutral'
  relatedGoal?: GoalPreview
  content: string
  isPinned: boolean
  createdAt: Date
}

type RowGoalUpdate = Omit<GoalUpdate, 'createdAt'> & { createdAt: string }

export async function getGoalUpdates(db: SQLiteDatabase, goalId: number): Promise<GoalUpdate[]> {
  const rows = await db.getAllAsync<Row<RowGoalUpdate>>(
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
      where goal_id = $goal_id
    `,
    { $goalId: goalId }
  )

  return rows.map(toCamelCase<RowGoalUpdate>).map((u) => {
    const { createdAt, ...updateData } = u

    return {
      ...updateData,
      createdAt: new Date(createdAt),
    }
  })
}
