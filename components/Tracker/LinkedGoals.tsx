import { Modal, RestModalProps } from '@/components/Modal'
import { useSQLiteContext } from 'expo-sqlite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { Pressable, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors, getGoalColor } from '@/common/theme'
import { ScrollView } from 'react-native-gesture-handler'
import { getGoalsLinkedToTracker } from '@/models/goal'
import { GoalPreviewItem } from '@/components/Goal/Goals'
import { deleteGoalLink, DeleteGoalLinkParam } from '@/models/tracker'
import { RefObject, useRef } from 'react'
import { Popover } from '@/components/Popover'
import { ContextMenuItem } from '@/components/ContextMenu'
import { useContextMenu } from '@/hooks/useContextMenu'

export function LinkedGoals({
  trackerId,
  modalProps,
  hideModal,
}: {
  trackerId: number
  modalProps: RestModalProps
  hideModal: () => void
}) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: goals, error: goalsError } = useQuery({
    queryKey: ['goals', 'goalTrackers', trackerId],
    queryFn: () => getGoalsLinkedToTracker(db, trackerId),
  })

  const { mutate: deleteGoalLinkMutator, error: deletingError } = useMutation({
    mutationFn: (param: DeleteGoalLinkParam) => deleteGoalLink(db, param),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['goals', 'goalTrackers', trackerId] }),
  })

  useErrorToasts(
    { title: 'Error loading goal trackers', errorData: goalsError },
    { title: 'Error deleting a goal link', errorData: deletingError }
  )

  const onModalPress = useRef<() => void>(() => null)

  return (
    <Modal
      {...modalProps}
      containerClassName='justify-start px-4'
      onPress={() => {
        onModalPress.current()
      }}
    >
      <View className='flex flex-col gap-6'>
        <View className='flex flex-row gap-6 items-center justify-between px-5'>
          <Text className='text-fg text-2xl font-bold'>Linked goals</Text>
          <Pressable onPress={hideModal}>
            {({ pressed }) => (
              <Feather name='x' size={24} color={pressed ? colors.fgSecondary : colors.fg} />
            )}
          </Pressable>
        </View>
        {goals?.length ? (
          <ScrollView className='max-h-[100%] grow-0 px-5 pb-12'>
            <View className='flex flex-col gap-2' onStartShouldSetResponder={() => true}>
              {goals?.map((goal) => (
                <View key={goal.id} className='flex flex-row gap-4 items-center'>
                  <GoalPreviewItem
                    {...goal}
                    color={getGoalColor('active')}
                    small
                    className='w-[80%] grow'
                  />
                  <LinkedGoalsDelete
                    trackerId={trackerId}
                    goalId={goal.id}
                    deleteGoalLink={deleteGoalLinkMutator}
                    onModalPressRef={onModalPress}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text className='text-fg text px-5'>
            No goal refers to this tracker yet. Go to a goal and link a tracker first.
          </Text>
        )}
      </View>
    </Modal>
  )
}

function LinkedGoalsDelete({
  trackerId,
  goalId,
  onModalPressRef,
  deleteGoalLink,
}: {
  trackerId: number
  goalId: number
  deleteGoalLink: (param: DeleteGoalLinkParam) => void
  onModalPressRef: RefObject<() => void>
}) {
  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = useContextMenu()

  return (
    <>
      <Pressable
        onPress={() => {
          onModalPressRef.current()
          onModalPressRef.current = hidePopover
          setTimeout(() => showPopover(), 0)
        }}
        hitSlop={4}
        className='flex-1'
      >
        {({ pressed }) => (
          <Feather
            name='trash'
            size={16}
            color={pressed || isPopoverShown ? colors.negativeActive : colors.negative}
          />
        )}
      </Pressable>
      <Popover
        isOpen={isPopoverShown}
        className='top-10 -right-5 z-[9999999]'
        animatedStyle={animatedStyle}
      >
        <ContextMenuItem
          label='Delete this value?'
          iconName='trash'
          color={colors.negative}
          onPress={() => {
            hidePopover()
            deleteGoalLink({ trackerId, goalId })
          }}
          last
          rnPressable
        />
      </Popover>
    </>
  )
}
