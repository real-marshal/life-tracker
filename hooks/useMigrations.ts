import { useEffect, useState } from 'react'
import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite'
import { getMigrations, initMigrations, insertMigration } from '@/models/migration'

// currently not used
// will be filled by babel-plugin-add-migration
// const migrations: ((db: SQLiteDatabase) => Promise<void>)[] = []

export function useMigrations() {
  const db = useSQLiteContext()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    async function processMigrations() {
      await initMigrations(db)
      const completedMigrations = await getMigrations(db)

      const migrationsContext = require.context('../assets/migrations')
      const migrationNames = migrationsContext.keys().sort()

      for (const [ind, migrationName] of migrationNames.entries()) {
        if (!completedMigrations[ind] || completedMigrations[ind].name !== migrationName) {
          console.log(`Running migration ${migrationName}`)

          const migration: (db: SQLiteDatabase) => Promise<void> = migrationsContext(migrationName)

          await db.withExclusiveTransactionAsync(async (db) => {
            await migration(db)

            await insertMigration(db, migrationName)
          })
        }
      }
    }

    processMigrations().catch((e) => setError(e))
  }, [db])

  return error
}
