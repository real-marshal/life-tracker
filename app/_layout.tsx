import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SQLiteProvider } from 'expo-sqlite'
import Toast, { ToastConfig } from 'react-native-toast-message'
import 'react-native-reanimated'
import '../global.css'
import { dbName, initSqlite } from '@/common/db'
import { useMigrations } from '@/hooks/useMigrations'
import { Appearance, Text, View } from 'react-native'
import { stringifyError } from '@/common/utils/error'
import { useEffect } from 'react'
import { AppErrorToast, AppSuccessToast } from '@/components/Toast'
import { useFonts } from 'expo-font'
import Feather from '@expo/vector-icons/Feather'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import * as SplashScreen from 'expo-splash-screen'

const toastConfig = {
  success: AppSuccessToast,
  error: AppErrorToast,
} satisfies ToastConfig

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: Infinity,
    },
  },
})

SplashScreen.preventAutoHideAsync()

// noinspection JSUnusedGlobalSymbols
export default function RootLayout() {
  useEffect(() => {
    // weirdly enough, passing DarkTheme to ThemeProvider isn't enough for StatusBar style auto to work correctly...
    Appearance.setColorScheme('dark')
  }, [])

  useFonts(Feather.font)

  return (
    <ThemeProvider value={DarkTheme}>
      <SQLiteProvider databaseName={dbName} onInit={initSqlite}>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <StatusBar style='auto' />
            <GestureHandlerRootView>
              <BottomSheetModalProvider>
                <RootView />
              </BottomSheetModalProvider>
            </GestureHandlerRootView>
            <Toast config={toastConfig} />
          </KeyboardProvider>
        </QueryClientProvider>
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
        name='settings/index'
        options={{ animation: 'slide_from_right', headerShown: false }}
      />
      <Stack.Screen
        name='settings/edit-metastats'
        options={{ animation: 'slide_from_right', headerShown: false }}
      />
      <Stack.Screen
        name='add-metastat'
        options={{ animation: 'slide_from_right', headerShown: false }}
      />
      <Stack.Screen
        name='goal/[id]'
        options={{ animation: 'slide_from_right', headerShown: false }}
      />
      <Stack.Screen
        name='tracker/[id]/edit'
        options={{ animation: 'slide_from_right', headerShown: false }}
      />
      <Stack.Screen
        name='tracker/add'
        options={{ animation: 'slide_from_right', animationDuration: 100, headerShown: false }}
      />
      <Stack.Screen name='+not-found' />
    </Stack>
  )
}

function MigrationsView({ error }: { error?: any }) {
  useEffect(() => {
    return () => SplashScreen.hide()
  }, [])

  return (
    <View>
      <Text style={{ color: 'white', fontSize: 40 }}>
        {error ? stringifyError(error) : 'Loading...'}
      </Text>
    </View>
  )
}
