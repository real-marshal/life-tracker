import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/common/utils/object'
import { Row } from '@/common/utils/types'

export interface MetaStat {
  id: number
  name: string
  value: number
  level?: number
}

export async function getMetaStats(db: SQLiteDatabase): Promise<MetaStat[]> {
  const rows = await db.getAllAsync<Row<MetaStat>>(`
  select id, name, value, level from metastat
  `)

  return rows.map(toCamelCase<MetaStat>)
}
