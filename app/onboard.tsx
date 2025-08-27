import { View, Text, Button } from 'react-native'
import { useRouter } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useMutator } from '@/hooks/useMutator'
import { useCallback, useEffect } from 'react'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { initNewDb } from '@/common/utils/db'
import { showErrorToast } from '@/common/utils/toast'

// noinspection JSUnusedGlobalSymbols
export default function OnboardScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [initNewDbMutator, isDone, dbInitError] = useMutator(initNewDb)

  const finishOnboarding = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['user'] }).then(() => router.replace('/')),
    [router, queryClient]
  )

  useEffect(() => {
    isDone && !dbInitError && finishOnboarding()
  }, [finishOnboarding, isDone, dbInitError, queryClient, router])

  useErrorToasts({ title: 'Error initializing a new DB', errorData: dbInitError })

  return (
    <View className='gap-4'>
      <Text style={{ color: 'white', fontSize: 40 }}>Onboard</Text>
      <Button onPress={() => initNewDbMutator(db)} title='Init new db' />
      <Button
        onPress={async () => {
          const { canceled, assets } = await DocumentPicker.getDocumentAsync()

          if (canceled) {
            return showErrorToast('Import cancelled', 'No file was chosen')
          }

          if (!assets[0].uri.endsWith('.db')) {
            return showErrorToast('Bad file type', 'Expected to be .db')
          }

          await FileSystem.copyAsync({
            from: assets[0].uri,
            to: `${FileSystem.documentDirectory}/SQLite/main.db`,
          })

          void finishOnboarding()
        }}
        title='Import existing'
      />
    </View>
  )
}
