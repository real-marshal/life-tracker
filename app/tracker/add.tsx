import { Keyboard, Text, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { TrackerForm } from '@/components/Tracker/TrackerForm'
import {
  addDateTracker,
  AddDateTrackerParam,
  addStatTracker,
  AddStatTrackerParam,
} from '@/models/tracker'
import { addDays } from 'date-fns'

// noinspection JSUnusedGlobalSymbols
export default function AddTrackerScreen() {
  const router = useRouter()
  const db = useSQLiteContext()
  const queryClient = useQueryClient()
  const { type } = useLocalSearchParams()

  const { mutate: addStatTrackerMutator, error: addingError } = useMutation({
    mutationFn: (param: AddStatTrackerParam | AddDateTrackerParam) =>
      type === 'stat'
        ? addStatTracker(db, param as AddStatTrackerParam)
        : addDateTracker(db, param as AddDateTrackerParam),
    onSuccess: () => {
      router.back()
      queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })

  useErrorToasts({ title: 'Error adding a tracker', errorData: addingError })

  return (
    <Pressable onPress={() => Keyboard.dismiss()}>
      <View className='flex flex-col m-safe pt-3 pb-3 px-3 gap-6 min-h-screen'>
        <View className='flex flex-row gap-4 items-center'>
          <Pressable onPress={() => router.back()}>
            <Feather name='chevron-left' size={30} color={colors.fg} />
          </Pressable>
          <Text className='text-fg text-2xl flex-1'>New tracker</Text>
        </View>
        <View className='flex flex-col gap-4'>
          <TrackerForm
            {...(type === 'stat'
              ? { id: -1, type: 'stat', name: '', prefix: '', suffix: '' }
              : { id: -1, type: 'date', name: '', date: addDays(new Date(), 1) })}
            onSave={(param) => addStatTrackerMutator(param as AddStatTrackerParam)}
            className='bg-bg'
          />
        </View>
      </View>
    </Pressable>
  )
}
