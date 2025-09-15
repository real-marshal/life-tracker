import { SQLiteDatabase } from 'expo-sqlite'
import { Row, RowCamelCase } from '@/common/utils/types'
import { toCamelCase } from '@/common/utils/object'
import { formatISO } from 'date-fns'
import { sortWithIndex } from '@/common/utils/array'

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

  return sortWithIndex(
    rows.map(toCamelCase<RowCamelCase<Tracker>>).map((rowTracker) => {
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
  )
}

type RowStatTracker = Omit<DetailedStatTracker, 'values'> & {
  trackerValues: DetailedStatTracker['values']
}

export async function getDetailedStatTracker(
  db: SQLiteDatabase,
  id: number
): Promise<DetailedStatTracker> {
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

export async function getTracker(db: SQLiteDatabase, id: number) {
  const row = await db.getFirstAsync<Row<Omit<Tracker, 'renderData'>>>(
    `
      select tracker.id,
             name,
             case
               when date_tracker.tracker_id is not null then 'date'
               when stat_tracker.tracker_id is not null then 'stat'
               end as type,
             date_tracker.date,
             stat_tracker.prefix,
             stat_tracker.suffix
      from tracker
             left join date_tracker on tracker.id = date_tracker.tracker_id
             left join stat_tracker on tracker.id = stat_tracker.tracker_id
      where tracker.id = $id
  `,
    { $id: id }
  )

  if (!row) {
    throw new Error(`No goal found with id ${id} - wtf?`)
  }

  const tracker = toCamelCase<Omit<Tracker, 'renderData'>>(row)

  return tracker.type === 'stat'
    ? tracker
    : {
        ...tracker,
        // kys dumbass
        date: new Date((tracker as DateTracker).date),
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

export async function updateTracker(
  db: SQLiteDatabase,
  { id, name }: Pick<BaseTracker, 'id' | 'name'>
) {
  await db.runAsync(
    `
      update tracker
      set name = $name
      where id = $id
    `,
    { $id: id, $name: name }
  )
}

export type UpdateStatTrackerParam = Pick<StatTracker, 'id' | 'name' | 'prefix' | 'suffix'>

export async function updateStatTracker(
  db: SQLiteDatabase,
  { id, name, prefix, suffix }: UpdateStatTrackerParam
) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await Promise.all([
      updateTracker(tx, { id, name }),
      tx.runAsync(
        `
        update stat_tracker
        set prefix = $prefix,
            suffix = $suffix
        where tracker_id = $id
      `,
        { $id: id, $prefix: prefix || null, $suffix: suffix || null }
      ),
    ])
  })
}

export type UpdateDateTrackerParam = Pick<DateTracker, 'id' | 'name' | 'date'>

export async function updateDateTracker(
  db: SQLiteDatabase,
  { id, name, date }: UpdateDateTrackerParam
) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await Promise.all([
      updateTracker(tx, { id, name }),
      tx.runAsync(
        `
        update date_tracker
        set date = $date
        where tracker_id = $id
      `,
        { $id: id, $date: formatISO(date) }
      ),
    ])
  })
}

export type AddStatTrackerParam = Pick<StatTracker, 'name' | 'prefix' | 'suffix'>

export async function addStatTracker(
  db: SQLiteDatabase,
  { name, prefix, suffix }: AddStatTrackerParam
) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.getFirstAsync<{ id: number }>(
      `
        insert into tracker(name, render_data)
        values ($name,
                '{}')
        returning id
      `,
      {
        $name: name,
      }
    )
    await tx.runAsync(
      `
        insert into stat_tracker(tracker_id, prefix, suffix)
        values ($tracker_id, $prefix, $suffix)
      `,
      {
        $tracker_id: result!.id,
        $prefix: prefix || null,
        $suffix: suffix || null,
      }
    )
  })
}

export type AddDateTrackerParam = Pick<DateTracker, 'name' | 'date'>

export async function addDateTracker(db: SQLiteDatabase, { name, date }: AddDateTrackerParam) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.getFirstAsync<{ id: number }>(
      `
        insert into tracker(name, render_data)
        values ($name,
                '{}')
        returning id
      `,
      {
        $name: name,
      }
    )
    await tx.runAsync(
      `
        insert into date_tracker(tracker_id, date)
        values ($tracker_id, $date)
      `,
      {
        $tracker_id: result!.id,
        $date: formatISO(date),
      }
    )
  })
}

export async function linkTracker(db: SQLiteDatabase, trackerId: number, goalId: number) {
  await db.runAsync(
    `
    insert into goal_tracker(goal_id, tracker_id)
    values ($goal_id, $tracker_id)
  `,
    { $goal_id: goalId, $tracker_id: trackerId }
  )
}

export async function unlinkTracker(db: SQLiteDatabase, trackerId: number, goalId: number) {
  await db.runAsync(
    `
      delete
      from goal_tracker
      where tracker_id = $tracker_id
        and goal_id = $goal_id
    `,
    { $goal_id: goalId, $tracker_id: trackerId }
  )
}

export async function updateTrackerIndices(
  db: SQLiteDatabase,
  updates: { id: number; index: number }[]
) {
  const statement = await db.prepareAsync(
    `update tracker
     set render_data = json_set(render_data, '$.index', $index)
     where id = $id`
  )

  try {
    await Promise.all(
      updates.map(({ id, index }) => statement.executeAsync({ $index: index, $id: id }))
    )
  } finally {
    await statement.finalizeAsync()
  }
}
