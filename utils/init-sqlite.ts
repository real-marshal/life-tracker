import { SQLiteDatabase } from 'expo-sqlite'

export async function initSqlite(db: SQLiteDatabase) {
  return db.execAsync('PRAGMA foreign_keys = ON')
}
