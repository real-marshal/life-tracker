import { Keyboard, Text, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LinkedGoals } from '@/components/Tracker/LinkedGoals'
import { HistoricalData } from '@/components/Tracker/HistoricalData'
import { Expandable } from '@/components/Expandable'
import {
  getTracker,
  updateDateTracker,
  UpdateDateTrackerParam,
  updateStatTracker,
  UpdateStatTrackerParam,
} from '@/models/tracker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { TrackerForm } from '@/components/Tracker/TrackerForm'

// noinspection JSUnusedGlobalSymbols
export default function EditTrackerScreen() {
  const router = useRouter()
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { id: idString, type } = useLocalSearchParams()
  const id = Number.parseInt(idString as string)

  const { data: tracker, error: trackerLoadingError } = useQuery({
    queryKey: ['trackers', id],
    queryFn: () => getTracker(db, id),
  })
  const { mutate: updateTracker, error: updatingError } = useMutation({
    mutationFn: (param: UpdateStatTrackerParam | UpdateDateTrackerParam) =>
      type === 'stat'
        ? updateStatTracker(db, param as UpdateStatTrackerParam)
        : updateDateTracker(db, param as UpdateDateTrackerParam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] })
      // for goal.relatedTrackers
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  useErrorToasts(
    {
      title: 'Error loading a tracker',
      errorData: trackerLoadingError,
    },
    {
      title: 'Error updating the tracker',
      errorData: updatingError,
    }
  )

  return (
    <Pressable onPress={() => Keyboard.dismiss()}>
      <View className='flex flex-col m-safe pt-3 pb-3 px-3 gap-6 min-h-screen'>
        <View className='flex flex-row gap-4 items-center'>
          <Pressable onPress={() => router.back()}>
            <Feather name='chevron-left' size={30} color={colors.fg} />
          </Pressable>
          <Text className='text-fg text-2xl flex-1'>Edit tracker</Text>
        </View>
        <View className='flex flex-col gap-4'>
          {tracker && <TrackerForm {...tracker} onSave={updateTracker} revertible />}
          <Expandable title='Historical data'>
            <HistoricalData trackerId={id} />
          </Expandable>
          <Expandable title='Linked goals'>
            <LinkedGoals trackerId={id} />
          </Expandable>
        </View>
      </View>
    </Pressable>
  )
}
