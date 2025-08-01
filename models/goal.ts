import { SQLiteDatabase } from 'expo-sqlite'
import { Row } from '@/common/utils/types'
import { toCamelCase } from '@/common/utils/object'
import { Duration, interval, intervalToDuration } from 'date-fns'
import { getTrackers, Tracker } from '@/models/tracker'

export interface GoalRenderData {
  index: number
}

export interface LtGoalPreview {
  id: number
  name: string
  relatedGoalsNum: number
  completedGoalsNum: number
}

export type LtGoalPreviewRender = LtGoalPreview & {
  renderData: GoalRenderData
}

export interface GoalPreview {
  id: number
  name: string
}

export type GoalPreviewRender = GoalPreview & {
  renderData: GoalRenderData
}

export interface LtGoal {
  id: number
  name: string
  progressDuration: Duration
  createdAt: Date
  closeDate?: Date
  why: string
  relatedTrackers: Tracker[]
  relatedGoals: GoalPreview[]
  completedRelatedGoals: GoalPreview[]
  abandonedRelatedGoals: GoalPreview[]
}

export interface Goal {
  id: number
  name: string
  progressDuration: Duration
  createdAt: Date
  closeDate?: Date
  why: string
  relatedTrackers: Tracker[]
  prerequisites: GoalPreview[]
  consequences: GoalPreview[]
}

export async function getLtGoals(db: SQLiteDatabase): Promise<LtGoalPreviewRender[]> {
  const rows = await db.getAllAsync<Row<LtGoalPreviewRender>>(`
    select id,
           name,
           render_data,
           (select count(*)
            from goal_relation
            where goal_id = id)           as related_goals_num,
           (select count(*)
            from goal_relation
                   left join goal g on g.id = related_goal_id
            where goal_id = id
              and g.status = 'completed') as completed_goals_num
    from goal
    where type = 'longterm'
      and status = 'active'
  `)

  return rows.map(toCamelCase<LtGoalPreviewRender>)
}

export async function getGoals(db: SQLiteDatabase): Promise<GoalPreviewRender[]> {
  const rows = await db.getAllAsync<Row<GoalPreviewRender>>(`
    select id,
           name,
           render_data
    from goal
    where type = 'normal'
      and status = 'active'
  `)

  return rows.map(toCamelCase<GoalPreviewRender>)
}

export async function getDelayedGoals(db: SQLiteDatabase): Promise<GoalPreviewRender[]> {
  const rows = await db.getAllAsync<Row<GoalPreviewRender>>(`
    select id,
           name,
           render_data
    from goal
    where type = 'normal'
      and status = 'delayed'
  `)

  return rows.map(toCamelCase<GoalPreviewRender>)
}

export async function getArchiveGoals(db: SQLiteDatabase): Promise<GoalPreview[]> {
  const rows = await db.getAllAsync<Row<GoalPreview>>(`
    select id,
           name,
           close_date
    from goal
    where status = 'completed'
       or status = 'abandoned'
    order by close_date desc
  `)

  return rows.map(toCamelCase<GoalPreview>)
}

type RowLtGoal = Omit<
  LtGoal,
  'progressDuration' | 'createdAt' | 'closeDate' | 'relatedTrackers'
> & {
  createdAt: string
  closeDate: string
}

export async function getLtGoal(db: SQLiteDatabase, id: number): Promise<LtGoal> {
  let ltGoalRow: Row<RowLtGoal> | null = null,
    trackers: Tracker[] = []

  await db.withExclusiveTransactionAsync(async (tx) => {
    ;[ltGoalRow, trackers] = await Promise.all([
      tx.getFirstAsync<Row<RowLtGoal>>(
        `
      select goal.id,
             goal.name,
             goal.created_at,
             goal.why,
             goal.close_date,
             json_group_array(json_object('id', related_goal.id, 'name',
                                          related_goal.name))
                              filter (where related_goal.id is not null)           as related_goals,
             json_group_array(json_object('id', completed_related_goal.id, 'name',
                                          completed_related_goal.name))
                              filter (where completed_related_goal.id is not null) as completed_related_goals,
             json_group_array(json_object('id', abandoned_related_goal.id, 'name',
                                          abandoned_related_goal.name))
                              filter (where abandoned_related_goal.id is not null) as abandoned_related_goals
      from goal
             left join goal_relation gl on goal_id = goal.id
             left join goal related_goal
                       on related_goal.id = gl.related_goal_id and related_goal.status = 'active'
             left join goal completed_related_goal
                       on completed_related_goal.id = gl.related_goal_id and
                          completed_related_goal.status = 'completed'
             left join goal abandoned_related_goal
                       on abandoned_related_goal.id = gl.related_goal_id and
                          abandoned_related_goal.status = 'abandoned'
      where goal.id = $id
    `,
        { $id: id }
      ),
      getTrackers(tx, id),
    ])
  })

  // noinspection PointlessBooleanExpressionJS
  if (!ltGoalRow) {
    throw new Error(`No goal found with id ${id} - wtf?`)
  }

  const ltGoal = toCamelCase<RowLtGoal>(ltGoalRow)

  const createdAt = new Date(ltGoal.createdAt)
  const closeDate = new Date(ltGoal.closeDate)

  return {
    ...ltGoal,
    createdAt,
    closeDate,
    progressDuration: intervalToDuration(interval(createdAt, closeDate ?? new Date())),
    relatedTrackers: trackers,
  }
}

type RowGoal = Omit<Goal, 'progressDuration' | 'createdAt' | 'closeDate' | 'relatedTrackers'> & {
  createdAt: string
  closeDate: string
}

export async function getGoal(db: SQLiteDatabase, id: number): Promise<Goal> {
  let goalRow: Row<RowGoal> | null = null,
    trackers: Tracker[] = []

  await db.withExclusiveTransactionAsync(async (tx) => {
    ;[goalRow, trackers] = await Promise.all([
      tx.getFirstAsync<Row<RowGoal>>(
        `
      select goal.id,
             goal.name,
             goal.created_at,
             goal.why,
             goal.close_date,
             json_group_array(json_object('id', prerequisite.id, 'name',
                                          prerequisite.name))
                              filter (where prerequisite.id is not null) as prerequisites,
             json_group_array(json_object('id', consequence.id, 'name',
                                          consequence.name))
                              filter (where consequence.id is not null)  as consequences
      from goal
             left join goal_link gl on gl.goal_id = goal.id
             left join goal_link gln on gln.next_goal_id = goal.id
             left join goal prerequisite
                       on prerequisite.id = gln.goal_id
             left join goal consequence
                       on consequence.id = gl.next_goal_id
      where goal.id = $id
    `,
        { $id: id }
      ),
      getTrackers(tx, id),
    ])
  })

  // noinspection PointlessBooleanExpressionJS
  if (!goalRow) {
    throw new Error(`No goal found with id ${id} - wtf?`)
  }

  const goal = toCamelCase<RowGoal>(goalRow)

  const createdAt = new Date(goal.createdAt)
  const closeDate = new Date(goal.closeDate)

  return {
    ...goal,
    createdAt,
    closeDate,
    progressDuration: intervalToDuration(interval(createdAt, closeDate ?? new Date())),
    relatedTrackers: trackers,
  }
}
