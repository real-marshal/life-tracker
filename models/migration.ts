import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/utils/object'
import { Row } from '@/utils/types'

export interface Migration {
  name: string
  createdAt: string
}

export function initMigrations(db: SQLiteDatabase): Promise<void> {
  return db.execAsync(`create table if not exists migration
                       (
                         name       text primary key,
                         created_at text
                       )`)
}

export async function getMigrations(db: SQLiteDatabase): Promise<Migration[]> {
  const rows = await db.getAllAsync<Row<Migration>>(
    'select name, created_at from migration order by created_at'
  )

  return rows.map(toCamelCase<Migration>)
}

export async function insertMigration(db: SQLiteDatabase, name: string): Promise<void> {
  await db.runAsync('insert into migration(name, created_at) values ($name, $created_at)', {
    $name: name,
    $created_at: new Date().toISOString(),
  })
}
