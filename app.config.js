const IS_DEV = process.env.APP_VARIANT === 'development'

export default {
  expo: {
    name: 'Lumex',
    slug: 'lumex',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'lumex',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'com.realmarshal.lumex.dev' : 'com.realmarshal.lumex',
    },
    android: {
      edgeToEdgeEnabled: true,
      package: IS_DEV ? 'com.realmarshal.lumex.dev' : 'com.realmarshal.lumex',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/logo.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#000000',
        },
      ],
      'expo-sqlite',
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'ae41d2e4-959c-429b-b761-30904974dd5b',
      },
    },
  },
}
