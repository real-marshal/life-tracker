import { Modal, RestModalProps } from '@/components/Modal'
import { Text, View, Pressable, ScrollView } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTrackers, linkTracker, unlinkTracker } from '@/models/tracker'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { TrackerItem } from '../Tracker/Trackers'
import { Checkbox } from 'expo-checkbox'

export function LinkTrackersModal({
  modalProps,
  hideModal,
  relatedTrackerIds,
  goalId,
}: {
  modalProps: RestModalProps
  hideModal: () => void
  relatedTrackerIds: number[]
  goalId: number
}) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: trackers, error: trackersError } = useQuery({
    queryKey: ['trackers'],
    queryFn: () => getTrackers(db),
  })

  const { mutate: changeLinkingMutator, error: changeLinkingError } = useMutation({
    mutationFn: ({ link, trackerId }: { link: boolean; trackerId: number }) =>
      link ? linkTracker(db, trackerId, goalId) : unlinkTracker(db, trackerId, goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', goalId] })
    },
  })

  useErrorToasts(
    { title: 'Error loading trackers', errorData: trackersError },
    { title: 'Error changing link', errorData: changeLinkingError }
  )

  return (
    <Modal {...modalProps} containerClassName='justify-start px-4'>
      <View className='flex flex-col gap-6'>
        <View className='flex flex-row gap-6 items-center justify-between px-5'>
          <Text className='text-accent text-2xl font-bold'>Link trackers</Text>
          <Pressable onPress={hideModal}>
            {({ pressed }) => (
              <Feather name='x' size={24} color={pressed ? colors.fgSecondary : colors.fg} />
            )}
          </Pressable>
        </View>
        <ScrollView className='max-h-[100%] grow-0 px-5 pb-12' contentContainerClassName='gap-4'>
          {trackers?.map((tracker) => {
            const value = relatedTrackerIds.includes(tracker.id)

            return (
              <View key={tracker.id} className='flex flex-row gap-3 items-center'>
                <Checkbox
                  value={value}
                  onValueChange={(value) =>
                    changeLinkingMutator({ link: value, trackerId: tracker.id })
                  }
                  color={colors.bgTertiary}
                  className='bg-bgTertiary'
                  style={{ borderRadius: 6 }}
                  hitSlop={4}
                />
                <TrackerItem
                  {...tracker}
                  onPress={() =>
                    changeLinkingMutator({
                      link: !value,
                      trackerId: tracker.id,
                    })
                  }
                />
              </View>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}
