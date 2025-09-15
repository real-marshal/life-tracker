// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
// const pluginQuery = require('@tanstack/eslint-plugin-query')

module.exports = defineConfig([
  expoConfig,
  // ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
    ignores: ['dist/*', '.expo'],
  },
])
