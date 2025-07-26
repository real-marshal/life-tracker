module.exports = function (api) {
  api.cache(true)

  return {
    // plugins: ['./tools/babel-plugin-add-migration.js'],
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  }
}
