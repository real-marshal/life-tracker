import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/common/utils/object'
import { Row, RowCamelCase } from '@/common/utils/types'
import { sortWithIndex } from '@/common/utils/array'

export interface MetaStat {
  id: number
  name: string
  value: number
  level: number | null
  autoDecay: 'slow' | 'moderate' | 'fast'
  decayData: MetaStatDecayData
  renderData: MetaStatRenderData
}

export interface MetaStatDecayData {
  isDecayedToday?: boolean
  lastValueIncreaseDate?: Date
}

export interface MetaStatRenderData {
  index?: number
}

export async function getMetaStats(db: SQLiteDatabase): Promise<MetaStat[]> {
  const rows = await db.getAllAsync<Row<MetaStat>>(`
    select id, name, value, level, render_data, decay_data, auto_decay
    from metastat
    order by id
  `)

  const metastats = rows.map(toCamelCase<RowCamelCase<MetaStat>>).map((r) => {
    const { isDecayedToday, lastValueIncreaseDate } = JSON.parse(r.decayData) as MetaStatDecayData

    return {
      ...r,
      renderData: JSON.parse(r.renderData),
      decayData: {
        isDecayedToday,
        lastValueIncreaseDate: lastValueIncreaseDate ? new Date(lastValueIncreaseDate) : undefined,
      },
    }
  })

  return sortWithIndex(metastats)
}

export async function updateMetaStatIndices(
  db: SQLiteDatabase,
  updates: { id: number; index: number }[]
) {
  const statement = await db.prepareAsync(
    `update metastat
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

export async function deleteMetaStat(db: SQLiteDatabase, id: number) {
  await db.runAsync(
    `
      delete
      from metastat
      where id = $id
    `,
    {
      $id: id,
    }
  )
}

export type UpdateMetaStatParam = {
  id: number
  name: string
  level: number | null
  autoDecay: MetaStat['autoDecay']
}

export async function updateMetaStat(
  db: SQLiteDatabase,
  { id, name, level, autoDecay }: UpdateMetaStatParam
) {
  await db.runAsync(
    `
      update
        metastat
      set name = $name,
          level = $level,
          auto_decay = $autoDecay
      where id = $id
    `,
    {
      $id: id,
      $name: name,
      $level: level,
      $autoDecay: autoDecay,
    }
  )
}
