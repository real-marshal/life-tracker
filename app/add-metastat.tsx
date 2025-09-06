import { Keyboard, Text, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addMetaStat, AddMetaStatParam } from '@/models/metastat'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { MetastatForm } from '@/components/Metastat/MetastatDetails'

// noinspection JSUnusedGlobalSymbols
export default function AddMetastatScreen() {
  const router = useRouter()
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { mutate: addMetaStatMutator, error: addingError } = useMutation({
    mutationFn: (param: AddMetaStatParam) => addMetaStat(db, param),
    onSuccess: () => {
      router.back()
      queryClient.invalidateQueries({ queryKey: ['metastats'] })
    },
  })

  useErrorToasts({ title: 'Error adding a meta stat', errorData: addingError })

  return (
    <Pressable onPress={() => Keyboard.dismiss()}>
      <View className='flex flex-col m-safe pt-3 pb-3 px-3 gap-6 min-h-screen'>
        <View className='flex flex-row gap-4 items-center'>
          <Pressable onPress={() => router.back()}>
            <Feather name='chevron-left' size={30} color={colors.fg} />
          </Pressable>
          <Text className='text-fg text-2xl flex-1'>New metastat</Text>
        </View>
        <View className='flex flex-col gap-4'>
          <MetastatForm
            metastat={{ id: -1, name: '', level: 0, autoDecay: 'slow' }}
            onSave={addMetaStatMutator}
            className='bg-bg'
          />
        </View>
      </View>
    </Pressable>
  )
}
