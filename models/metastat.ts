import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/common/utils/object'
import { Row, RowCamelCase } from '@/common/utils/types'
import { sortWithIndex } from '@/common/utils/array'

export interface MetaStat {
  id: number
  name: string
  value: number
  level?: number
  renderData: MetaStatRenderData
}

export interface MetaStatRenderData {
  index?: number
}

export async function getMetaStats(db: SQLiteDatabase): Promise<MetaStat[]> {
  const rows = await db.getAllAsync<Row<MetaStat>>(`
    select id, name, value, level, render_data
    from metastat
    order by id
  `)

  const metastats = rows
    .map(toCamelCase<RowCamelCase<MetaStat>>)
    .map((r) => ({ ...r, renderData: JSON.parse(r.renderData) }))

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
