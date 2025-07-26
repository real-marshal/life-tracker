import { useEffect } from 'react'
import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite'
import { getMigratons, initMigrations, insertMigration } from '@/models/migration'

// will be filled by babel-plugin-add-migration
// const migrations: ((db: SQLiteDatabase) => Promise<void>)[] = []

export function useMigrations() {
  const db = useSQLiteContext()

  useEffect(() => {
    async function processMigrations() {
      await initMigrations(db)
      const completedMigrations = await getMigratons(db)

      const migrationsContext = require.context('../assets/migrations')
      const migrationNames = migrationsContext.keys().slice(0, -3).sort()

      for (const [ind, migrationName] of migrationNames.entries()) {
        if (!completedMigrations[ind] || completedMigrations[ind].name !== migrationName) {
          const migration: (db: SQLiteDatabase) => Promise<void> = migrationsContext(migrationName)

          await db.withExclusiveTransactionAsync(async (db) => {
            await migration(db)
            await insertMigration(db, migrationName)
          })
        }
      }
    }

    processMigrations()
  }, [db])
}
