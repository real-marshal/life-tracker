import { useSQLiteContext } from 'expo-sqlite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors, getGoalColor } from '@/common/theme'
import { ScrollView } from 'react-native-gesture-handler'
import { getGoalsLinkedToTracker } from '@/models/goal'
import { GoalPreviewItem } from '@/components/Goal/Goals'
import { deleteGoalLink, DeleteGoalLinkParam } from '@/models/tracker'
import { ContextMenuItem } from '@/components/ContextMenu'
import { Modal, useModal } from '@/components/Modal'
import { useState } from 'react'
import hairlineWidth = StyleSheet.hairlineWidth

export function LinkedGoals({ trackerId }: { trackerId: number }) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: goals, error: goalsError } = useQuery({
    queryKey: ['goals', 'goalTrackers', trackerId],
    queryFn: () => getGoalsLinkedToTracker(db, trackerId),
  })

  const { mutate: deleteGoalLinkMutator, error: deletingError } = useMutation({
    mutationFn: (param: DeleteGoalLinkParam) => deleteGoalLink(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })

  useErrorToasts(
    { title: 'Error loading goal trackers', errorData: goalsError },
    { title: 'Error deleting a goal link', errorData: deletingError }
  )

  return (
    <View className='flex flex-col gap-6 max-h-[350]'>
      {goals?.length ? (
        <ScrollView className='px-5 grow-0' contentContainerClassName='flex flex-col gap-2 py-5'>
          <View className='flex flex-col gap-2' onStartShouldSetResponder={() => true}>
            {goals?.map((goal) => (
              <View key={goal.id} className='flex flex-row gap-4 items-center'>
                <GoalPreviewItem
                  {...goal}
                  small
                  className='w-[80%] grow'
                  color={getGoalColor('active', goal.type === 'longterm')}
                />
                <LinkedGoalsDelete
                  trackerId={trackerId}
                  goalId={goal.id}
                  deleteGoalLink={deleteGoalLinkMutator}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text className='text-fgSecondary text p-5'>
          No goal refers to this tracker yet. Go to a goal and link a tracker first.
        </Text>
      )}
    </View>
  )
}

function LinkedGoalsDelete({
  trackerId,
  goalId,
  deleteGoalLink,
}: {
  trackerId: number
  goalId: number
  deleteGoalLink: (param: DeleteGoalLinkParam) => void
}) {
  const { showModal, hideModal, ...modalProps } = useModal()

  const [contextMenuPosition, setContextMenuPosition] = useState(0)

  return (
    <>
      <Pressable
        onPress={(e) => {
          setContextMenuPosition(e.nativeEvent.pageY - e.nativeEvent.locationY)
          showModal()
        }}
        hitSlop={4}
        className='flex-1'
      >
        {({ pressed }) => (
          <Feather
            name='trash'
            size={16}
            color={pressed || modalProps.isModalShown ? colors.negativeActive : colors.negative}
          />
        )}
      </Pressable>
      <Modal
        {...modalProps}
        onPress={hideModal}
        containerClassName='absolute p-0 m-0 border-hairline border-bgTertiary'
        containerStyle={{
          top: contextMenuPosition,
          right: 30,
          borderColor: colors.bgTertiary,
          borderWidth: hairlineWidth,
        }}
        disableOverlay
      >
        <ContextMenuItem
          label='Delete this value?'
          iconName='trash'
          color={colors.negative}
          onPress={() => {
            hideModal()
            deleteGoalLink({ trackerId, goalId })
          }}
          first
          last
          rnPressable
        />
      </Modal>
    </>
  )
}
