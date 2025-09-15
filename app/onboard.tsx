import { View, Text, TextInput, Pressable, Keyboard } from 'react-native'
import { useRouter } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { initNewDb } from '@/common/db'
import { showErrorToast } from '@/common/toast'
import { AppButton } from '@/components/AppButton'
import { colors } from '@/common/theme'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

// noinspection JSUnusedGlobalSymbols
export default function OnboardScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { mutate: initNewDbMutator, error: dbInitError } = useMutation({
    mutationFn: (param: Parameters<typeof initNewDb>[1]) => initNewDb(db, param),
    onSuccess: () => finishOnboarding(),
  })

  const finishOnboarding = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['user'] }).then(() => router.replace('/')),
    [router, queryClient]
  )

  useErrorToasts({ title: 'Error initializing a new DB', errorData: dbInitError })

  const [name, setName] = useState('Human')

  return (
    <KeyboardAwareScrollView className='flex flex-col m-safe' bottomOffset={20}>
      <Pressable onPress={Keyboard.dismiss} className='py-6 px-3 gap-1 items-center justify-center'>
        <Text className='text-accent text-4xl font-bold mt-6 mb-3'>Welcome to Lumex</Text>
        <View className='flex flex-col bg-bgSecondary px-6 py-8 m-4 rounded-lg gap-6'>
          <Text className='text-fg text-lg text-center'>
            If you <Text className='font-bold text-accent'>already used</Text> this app before, you
            can import an existing database file.
          </Text>
          <AppButton
            text='Import existing DB'
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
            color={colors.fg}
            activeColor={colors.fgSecondary}
          />
        </View>
        <Text className='text-fgSecondary text-lg text-center font-bold uppercase'>Or</Text>
        <View className='flex flex-col bg-bgSecondary px-6 py-8 m-4 rounded-lg gap-6 items-center'>
          <Text className='text-fg text-lg text-center'>
            If this is your <Text className='font-bold text-accent'>first time</Text>, let's create
            a new local database to store your data.
          </Text>

          <View className='gap-1 w-[200] mb-4'>
            <Text className='text-fgSecondary'>Your name: </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className='text-fg bg-bgTertiary px-3 py-2 rounded-md text-lg'
              maxLength={30}
            />
          </View>

          <AppButton
            text='Create a DB with examples'
            color={colors.accent}
            activeColor={colors.accentActive}
            onPress={() => initNewDbMutator({ shouldSeed: true, name })}
          />
          <AppButton
            text='Create an empty DB'
            color={colors.fg}
            activeColor={colors.fgSecondary}
            onPress={() => initNewDbMutator({ shouldSeed: false, name })}
          />
        </View>
      </Pressable>
    </KeyboardAwareScrollView>
  )
}
