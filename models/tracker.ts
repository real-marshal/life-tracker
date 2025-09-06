import { SQLiteDatabase } from 'expo-sqlite'
import { Row, RowCamelCase } from '@/common/utils/types'
import { toCamelCase } from '@/common/utils/object'
import { formatISO } from 'date-fns'

export interface TrackerRenderData {
  index: number
  size: number
}

export interface BaseTracker {
  id: number
  name: string
  renderData: TrackerRenderData
  type: 'date' | 'stat'
}

export interface DateTracker extends BaseTracker {
  type: 'date'
  date: Date
}

export interface StatTracker extends BaseTracker {
  type: 'stat'
  prefix?: string
  suffix?: string
  value?: number
}

export type Tracker = DateTracker | StatTracker

export interface DetailedStatTracker {
  id: number
  name: string
  prefix?: string
  suffix?: string
  values: { date: string; value: number; id: number }[]
}

export async function getTrackers(db: SQLiteDatabase, goalId?: number): Promise<Tracker[]> {
  const query = `
    select name,
           render_data,
           tracker.id as id,
           case
             when date_tracker.tracker_id is not null then 'date'
             when stat_tracker.tracker_id is not null then 'stat'
             end      as type,
           date_tracker.date,
           stat_tracker.prefix,
           stat_tracker.suffix,
           (select value
            from stat_value
            where stat_value.tracker_id = tracker.id
            order by created_at desc
            limit 1)  as value
    from tracker
           left join goal_tracker on tracker.id = goal_tracker.tracker_id
           left join date_tracker on tracker.id = date_tracker.tracker_id
           left join stat_tracker on tracker.id = stat_tracker.tracker_id
  `

  const rows = await (goalId
    ? db.getAllAsync<Row<Tracker>>(
        `
        ${query}
        where goal_id = $goalId
        `,
        { $goalId: goalId }
      )
    : db.getAllAsync<Row<Tracker>>(query))

  return rows.map(toCamelCase<RowCamelCase<Tracker>>).map((rowTracker) => {
    if (rowTracker.type === 'stat') {
      return {
        ...rowTracker,
        renderData: JSON.parse(rowTracker.renderData),
      }
    }

    const { date, ...dateTrackerRest } = rowTracker

    return {
      ...dateTrackerRest,
      date: new Date(date),
      renderData: JSON.parse(dateTrackerRest.renderData),
    }
  })
}

type RowStatTracker = Omit<DetailedStatTracker, 'values'> & {
  trackerValues: DetailedStatTracker['values']
}

export async function getStatTracker(db: SQLiteDatabase, id: number): Promise<DetailedStatTracker> {
  const row = await db.getFirstAsync<Row<RowStatTracker>>(
    `
      select name,
             tracker.id                                                as id,
             stat_tracker.prefix,
             stat_tracker.suffix,
             json_group_array(json_object('date', stat_value.created_at, 'value',
                                          stat_value.value, 'id', stat_value.id))
                              filter (where stat_value.id is not null) as tracker_values
      from tracker
             left join stat_tracker on tracker.id = stat_tracker.tracker_id
             left join stat_value on tracker.id = stat_value.tracker_id
      where tracker.id = $id
      order by stat_value.created_at
    `,
    { $id: id }
  )

  if (!row) {
    throw new Error(`No stat tracker found with tracker_id ${id} - wtf?`)
  }

  const { trackerValues, ...values } = toCamelCase<RowCamelCase<RowStatTracker>>(row)

  return {
    ...values,
    values: JSON.parse(trackerValues),
  }
}

export type AddStatValueParam = {
  trackerId: number
  value: number
}

export async function deleteTracker(db: SQLiteDatabase, id: number) {
  await db.runAsync(
    `
      delete
      from tracker
      where id = $id
  `,
    { $id: id }
  )
}

export async function addStatValue(db: SQLiteDatabase, { trackerId, value }: AddStatValueParam) {
  await db.runAsync(
    `
      insert into stat_value(tracker_id, value, created_at)
      values ($trackerId, $value, $createdAt)
    `,
    { $trackerId: trackerId, $value: value, $createdAt: formatISO(new Date()) }
  )
}

export type UpdateStatValueParam = {
  id: number
  value: number
}

export async function updateStatValue(db: SQLiteDatabase, { id, value }: UpdateStatValueParam) {
  await db.runAsync(
    `
      update stat_value
      set value = $value
      where id = $id
    `,
    { $value: value, $id: id }
  )
}

export async function deleteStatValue(db: SQLiteDatabase, id: number) {
  await db.runAsync(
    `
      delete from stat_value
      where id = $id
    `,
    { $id: id }
  )
}

export type DeleteGoalLinkParam = {
  trackerId: number
  goalId: number
}

export async function deleteGoalLink(
  db: SQLiteDatabase,
  { trackerId, goalId }: DeleteGoalLinkParam
) {
  await db.runAsync(
    `
      delete
      from goal_tracker
      where tracker_id = $trackerId
        and goal_id = $goalId
    `,
    { $trackerId: trackerId, $goalId: goalId }
  )
}
