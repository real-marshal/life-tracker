import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SQLiteProvider } from 'expo-sqlite'
import Toast, { ToastConfig } from 'react-native-toast-message'
import 'react-native-reanimated'
import '../global.css'
import { initSqlite } from '@/common/utils/db'
import { useMigrations } from '@/hooks/useMigrations'
import { Appearance, Text, View } from 'react-native'
import { stringifyError } from '@/common/utils/error'
import { useEffect } from 'react'
import { AppErrorToast, AppSuccessToast } from '@/components/Toast'
import { useFonts } from 'expo-font'
import Feather from '@expo/vector-icons/Feather'

const toastConfig = {
  success: AppSuccessToast,
  error: AppErrorToast,
} satisfies ToastConfig

export default function RootLayout() {
  useEffect(() => {
    // weirdly enough, passing DarkTheme to ThemeProvider isn't enough for StatusBar style auto to work correctly...
    Appearance.setColorScheme('dark')
  }, [])

  useFonts(Feather.font)

  return (
    <ThemeProvider value={DarkTheme}>
      <SQLiteProvider databaseName='main.db' onInit={initSqlite}>
        <StatusBar style='auto' />
        <RootView />
        <Toast config={toastConfig} />
      </SQLiteProvider>
    </ThemeProvider>
  )
}

function RootView() {
  const [areMigrationsDone, migrationsError] = useMigrations()

  if (!areMigrationsDone || migrationsError) return <MigrationsView error={migrationsError} />

  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='onboard' options={{ headerShown: false }} />
      <Stack.Screen
        name='settings'
        options={{ animation: 'slide_from_right', animationDuration: 200 }}
      />
      <Stack.Screen
        name='goal/[id]'
        options={{ animation: 'slide_from_right', animationDuration: 200, headerShown: false }}
      />
      <Stack.Screen name='+not-found' />
    </Stack>
  )
}

function MigrationsView({ error }: { error?: any }) {
  return (
    <View>
      <Text style={{ color: 'white', fontSize: 40 }}>
        {error ? stringifyError(error) : 'Loading...'}
      </Text>
    </View>
  )
}
