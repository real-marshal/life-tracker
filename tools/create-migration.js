/* eslint-disable no-undef */
const fs = require('node:fs')
const path = require('path')

const name = process.argv[2]
const migrationName = `${new Date().toISOString().slice(0, 16)}_${name}.js`

const code = `\
// Migration ${migrationName}

module.exports = (db) => {
  return db.execAsync('')
}
`

const migrationPath = path.join(__dirname, `../assets/migrations/${migrationName}`)

fs.writeFileSync(migrationPath, code)
