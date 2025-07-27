const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(
  {
    ...config,
    resolver: {
      ...config.resolver,
      blockList: [config.resolver.blockList, /device\.db/],
    },
  },
  { input: './global.css' }
)
