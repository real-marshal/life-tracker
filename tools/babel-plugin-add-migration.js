/* eslint-disable no-undef */

// This was created because I didn't realize require.context() returns a function
// that can import those found modules, not just an object with a keys() function...
// I'm leaving it here for now in case require.context won't be reliable

const pathModule = require('node:path')
const fs = require('node:fs')

const migrationNames = fs
  .readdirSync(pathModule.join(__dirname, '../assets/migrations'))
  .map((m) => m.slice(0, -3))

module.exports = ({ types: t }) => {
  return {
    visitor: {
      VariableDeclarator(path, state) {
        if (!/hooks\/useMigrations\.ts$/.test(state.filename)) {
          return
        }

        if (
          path.node.id.name === 'migrations' &&
          path.node.init &&
          path.node.init.type === 'ArrayExpression'
        ) {
          path.node.init.elements = migrationNames.map((m) =>
            t.objectExpression([
              t.objectProperty(t.identifier('name'), t.stringLiteral(m)),
              t.objectProperty(
                t.identifier('fn'),
                t.callExpression(t.identifier('require'), [
                  t.stringLiteral(`@/assets/migrations/${m}`),
                ])
              ),
            ])
          )
        }
      },
    },
  }
}
