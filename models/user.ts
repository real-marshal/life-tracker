import { SQLiteDatabase } from 'expo-sqlite'
import { toCamelCase } from '@/common/utils/object'
import { Row } from '@/common/utils/types'

export interface User {
  id: number
  name: string
  isOnboarded: boolean
}

export async function getUser(db: SQLiteDatabase): Promise<User | null> {
  const row = await db.getFirstAsync<Row<User>>(`
    select id, name, is_onboarded
    from user
    limit 1
  `)

  return row ? toCamelCase<User>(row) : null
}

export async function markUserAsOnboarded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('update user set is_onboarded = 1')
}
