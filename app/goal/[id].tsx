import { Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getGoal, getLtGoal, Goal, LtGoal } from '@/models/goal'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { colors, goalStatusActiveColorMap, goalStatusColorMap } from '@/common/theme'
import Feather from '@expo/vector-icons/Feather'
import { formatDateSmart, formatDurationTwoLongValues, makeDateTz } from '@/common/utils/date'
import { Trackers } from '@/components/Tracker/Trackers'
import { GoalPreviewItem } from '@/components/Goal/Goals'
import {
  addGoalUpdate,
  deleteGoalUpdate,
  getGoalUpdates,
  GoalUpdate,
  updateGoalUpdate,
  UpdateGoalUpdateParam,
} from '@/models/goalUpdate'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FloatingButton, FloatingMenuItem } from '@/components/FloatingMenu'
import { Popover } from '@/components/Popover'
import { useFloatingMenu } from '@/hooks/useFloatingMenu'
import { Pressable, TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useModal } from '@/components/Modal'
import { GoalUpdateRecord } from '@/components/Goal/GoalUpdateRecord'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ContextMenuItem, ContextMenuSection } from '@/components/ContextMenu'

const progressTextMap: Record<Goal['status'], [string, string]> = {
  active: ['In progress for ', ' since '],
  delayed: ['In progress for ', ' since '],
  completed: ['Completed in ', ', started '],
  abandoned: ['Abandoned after ', ', started '],
}

export default function GoalScreen() {
  const { id, type } = useLocalSearchParams()
  const db = useSQLiteContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const isLongTerm = type === 'longterm'

  const { data: goal, error: goalError } = useQuery<LtGoal | Goal>({
    queryKey: ['goal', id],
    queryFn: () =>
      isLongTerm
        ? getLtGoal(db, Number.parseInt(id as string))
        : getGoal(db, Number.parseInt(id as string)),
  })
  const { data: goalUpdatesStored, error: goalUpdatesError } = useQuery({
    queryKey: ['goalUpdates', id],
    queryFn: () => getGoalUpdates(db, Number.parseInt(id as string)),
    // screens in react native navigator aren't completely recreated on navigation
    // so when the goal updates are cached, react thread gets stuck trying to render all those components,
    // creating ~50ms animation delay. but if they are not cached, the first render is much simpler,
    // removing this delay, while the list is rendered during the animation itself
    // we are kinda decreasing our TTL here
    // structuralSharing: structuralSharingWithDateTz,
    gcTime: 0,
  })
  const { mutate: addGoalUpdateMutator, error: goalUpdateAddingError } = useMutation({
    mutationFn: (goalUpdate: GoalUpdate) =>
      addGoalUpdate(db, Number.parseInt(id as string), goalUpdate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goalUpdates'] }),
  })
  const { mutate: updateGoalUpdateMutator, error: goalUpdateUpdatingError } = useMutation({
    mutationFn: (param: UpdateGoalUpdateParam) => updateGoalUpdate(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goalUpdates'] }),
  })
  const { mutate: deleteGoalUpdateMutator, error: goalUpdateDeletingError } = useMutation({
    mutationFn: (id: number) => deleteGoalUpdate(db, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goalUpdates'] }),
  })

  useErrorToasts(
    { title: 'Error loading a goal', errorData: goalError },
    { title: 'Error loading goal updates', errorData: goalUpdatesError },
    { title: 'Error adding a goal update', errorData: goalUpdateAddingError },
    { title: 'Error updating a goal update', errorData: goalUpdateUpdatingError },
    { title: 'Error deleting a goal update', errorData: goalUpdateDeletingError }
  )
  console.log(goalUpdatesStored?.length)
  const [goalUpdates, setGoalUpdates] = useState(goalUpdatesStored)

  useEffect(() => {
    setGoalUpdates(goalUpdatesStored)
  }, [goalUpdatesStored])

  const goalUpdatesByDate = useMemo(
    () =>
      goalUpdates?.reduce(
        (result, goalUpdate) => {
          const date = goalUpdate.createdAt.date.toDateString()

          result[date] ??= []
          result[date].push(goalUpdate)

          return result
        },
        {} as Record<string, GoalUpdate[]>
      ) ?? {},
    [goalUpdates]
  )

  const onContextMenuCancelRef = useRef<() => void>(() => null)
  const onModalCancelRef = useRef<() => void>(() => null)

  const {
    isPopoverShown: isFloatingMenuShown,
    hidePopover: hideFloatingMenu,
    showPopover: showFloatingMenu,
    animatedStyle: floatingMenuStyle,
  } = useFloatingMenu()

  const {
    isPopoverShown: isContextMenuShown,
    hidePopover: hideContextMenu,
    showPopover: showContextMenu,
    animatedStyle: contextMenuStyle,
  } = useContextMenu()

  const {
    showModal: showSaveNewModal,
    hideModal: hideSaveNewModal,
    ...saveNewModalProps
  } = useModal(() =>
    setGoalUpdates((goalUpdates) => goalUpdates?.filter((goalUpdate) => goalUpdate.id !== -1))
  )
  const {
    showModal: showDeleteModal,
    hideModal: hideDeleteModal,
    ...deleteModalProps
  } = useModal(() => onModalCancelRef.current())
  const {
    showModal: showUpdateModal,
    hideModal: hideUpdateModal,
    ...updateModalProps
  } = useModal(() => onModalCancelRef.current())

  const onAddConfirm = useRef<() => void>(null)
  const onDeleteConfirm = useRef<() => void>(null)
  const onUpdateConfirm = useRef<() => void>(null)

  const onAddGoalUpdate = (sentiment: GoalUpdate['sentiment']) => {
    hideFloatingMenu()

    setGoalUpdates((goalUpdates) => [
      {
        id: -1,
        content: '',
        createdAt: makeDateTz(new Date().toISOString()),
        sentiment,
        type: 'normal',
        isPinned: false,
      },
      ...(goalUpdates ?? []),
    ])
  }

  const accentColor =
    goal?.status && goal.status !== 'active'
      ? goalStatusColorMap[goal.status]
      : isLongTerm
        ? colors.ltGoal
        : colors.currentGoal

  const accentColorActive =
    goal?.status && goal.status !== 'active'
      ? goalStatusActiveColorMap[goal.status]
      : isLongTerm
        ? colors.ltGoalActive
        : colors.currentGoalActive

  return (
    <>
      <TouchableWithoutFeedback
        onPress={() => {
          hideFloatingMenu()
          hideContextMenu()
          onContextMenuCancelRef.current()
        }}
      >
        <KeyboardAwareScrollView bottomOffset={10} stickyHeaderIndices={[0]}>
          <View className='flex flex-row gap-2 items-center justify-between pt-safe-offset-3 pb-3 px-3 bg-bg'>
            <View className='flex flex-row gap-4 items-center flex-1'>
              <Pressable onPress={() => router.back()}>
                <Feather name='chevron-left' size={30} color={accentColor} />
              </Pressable>
              <Text
                className='text-fg text-2xl flex-1'
                style={{ color: accentColor }}
                numberOfLines={2}
                ellipsizeMode='tail'
              >
                {goal?.name}
              </Text>
            </View>
            <Pressable onPress={showContextMenu}>
              {({ pressed }) => (
                <Feather
                  name='more-horizontal'
                  size={24}
                  color={pressed ? accentColorActive : accentColor}
                />
              )}
            </Pressable>
          </View>
          <View
            className='mb-safe mx-safe px-3 pb-5 pt-3 flex flex-col gap-6 min-h-screen'
            onStartShouldSetResponder={() => true}
          >
            <View className='flex flex-col gap-4 p-4 bg-bgSecondary rounded-lg border-hairline border-[#444]'>
              <View className='flex flex-row flex-wrap'>
                <Text className='text-fgSecondary'>
                  {goal?.status && progressTextMap[goal?.status][0]}
                </Text>
                <Text className='font-bold' style={{ color: accentColor }}>
                  {goal?.progressDuration && formatDurationTwoLongValues(goal?.progressDuration)}
                </Text>
                <Text className='text-fgSecondary'>
                  {goal?.status && progressTextMap[goal?.status][1]}
                </Text>
                <Text className='font-bold' style={{ color: accentColor }}>
                  {goal?.createdAt.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              {goal?.why && (
                <View className='flex flex-col gap-[2]'>
                  <Text className='text-fgSecondary text-sm'>Why:</Text>
                  <Text className='text-fg leading-5'>{goal?.why}</Text>
                </View>
              )}
              {!!goal?.relatedTrackers?.length && (
                <View className='flex flex-col gap-1'>
                  <Text className='text-fgSecondary text-sm'>Related trackers:</Text>
                  <Trackers trackers={goal.relatedTrackers} />
                </View>
              )}
              {!isLongTerm && !!(goal as Goal)?.prerequisites?.length && (
                <View className='flex flex-col gap-[2]'>
                  <Text className='text-fgSecondary text-sm'>
                    Prerequisites ({(goal as Goal).prerequisites.length}):
                  </Text>
                  <View className='flex flex-col flex-wrap'>
                    {(goal as Goal).prerequisites?.map((goal) => (
                      <GoalPreviewItem {...goal} key={goal.id} small />
                    ))}
                  </View>
                </View>
              )}
              {!isLongTerm && !!(goal as Goal)?.consequences?.length && (
                <View className='flex flex-col gap-[2]'>
                  <Text className='text-fgSecondary text-sm'>
                    Consequences ({(goal as Goal).consequences.length}):
                  </Text>
                  <View className='flex flex-col flex-wrap'>
                    {(goal as Goal).consequences?.map((goal) => (
                      <GoalPreviewItem {...goal} key={goal.id} small />
                    ))}
                  </View>
                </View>
              )}
            </View>
            <View className='flex flex-col gap-4'>
              {useMemo(
                () =>
                  Object.values(goalUpdatesByDate).map((dateGoalUpdates) => {
                    const date = formatDateSmart(dateGoalUpdates[0].createdAt)

                    return (
                      <View key={date} className='flex flex-col gap-2'>
                        <Text className='text-fgSecondary text-center font-light border-b-hairline border-fgSecondary pb-[1] text-lg'>
                          {date}
                        </Text>
                        <View className='flex flex-col gap-3'>
                          {dateGoalUpdates.map((goalUpdate) => (
                            <GoalUpdateRecord
                              key={goalUpdate.id}
                              {...goalUpdate}
                              onAddGoalUpdate={(value) => {
                                showSaveNewModal()

                                const [addedGoalUpdate] = goalUpdates ?? []
                                onAddConfirm.current = () =>
                                  addGoalUpdateMutator({ ...addedGoalUpdate, content: value })
                              }}
                              onDeleteGoalUpdate={() => {
                                showDeleteModal()
                                onDeleteConfirm.current = () =>
                                  deleteGoalUpdateMutator(goalUpdate.id)
                              }}
                              onUpdateGoalUpdate={(newContent) => {
                                showUpdateModal()
                                onUpdateConfirm.current = () =>
                                  updateGoalUpdateMutator({
                                    id: goalUpdate.id,
                                    content: newContent,
                                  })
                              }}
                              onContextMenuCancelRef={onContextMenuCancelRef}
                              onModalCancelRef={onModalCancelRef}
                            />
                          ))}
                        </View>
                      </View>
                    )
                  }),
                [
                  addGoalUpdateMutator,
                  deleteGoalUpdateMutator,
                  goalUpdates,
                  goalUpdatesByDate,
                  showDeleteModal,
                  showSaveNewModal,
                  showUpdateModal,
                  updateGoalUpdateMutator,
                ]
              )}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
      {goal?.status === 'active' && (
        <>
          <FloatingButton
            onPress={() => (isFloatingMenuShown ? hideFloatingMenu() : showFloatingMenu())}
            color={isLongTerm ? colors.ltGoal : colors.currentGoal}
            activeColor={isLongTerm ? colors.ltGoalActive : colors.currentGoalActive}
            active={isFloatingMenuShown}
          />
          <Popover
            isOpen={isFloatingMenuShown}
            className='right-safe-offset-7 bottom-[90px] z-[9999999]'
            animatedStyle={floatingMenuStyle}
          >
            <FloatingMenuItem
              title='Add a negative update'
              description='Obstacles are inevitable'
              onPress={() => onAddGoalUpdate('negative')}
              color={colors.negative}
            />
            <FloatingMenuItem
              title='Add a neutral update'
              description='Just a quick note'
              onPress={() => onAddGoalUpdate('neutral')}
            />
            <FloatingMenuItem
              title='Add a positive update'
              description='One stop closer to success'
              onPress={() => onAddGoalUpdate('positive')}
              color={colors.positive}
            />
          </Popover>
          <ConfirmModal
            text='Save this goal update?'
            hideModal={hideSaveNewModal}
            modalProps={saveNewModalProps}
            onConfirm={() => onAddConfirm.current?.()}
          />
          <ConfirmModal
            text='Delete this goal update?'
            hideModal={hideDeleteModal}
            modalProps={deleteModalProps}
            onConfirm={() => onDeleteConfirm.current?.()}
            deletion
          />
          <ConfirmModal
            text='Update this goal update?'
            hideModal={hideUpdateModal}
            modalProps={updateModalProps}
            onConfirm={() => onUpdateConfirm.current?.()}
          />
          <Popover
            isOpen={isContextMenuShown}
            className='right-safe-offset-7 top-[90px] z-[9999999]'
            animatedStyle={contextMenuStyle}
          >
            <ContextMenuSection label='Change status' first />
            <ContextMenuItem
              label='Abandon'
              iconName='x'
              color={colors.negative}
              onPress={() => null}
            />
            <ContextMenuItem
              label='Complete'
              iconName='check'
              color={colors.positive}
              onPress={() => null}
            />
            <ContextMenuItem
              label='Delay'
              iconName='clock'
              color={colors.delayedGoal}
              onPress={() => null}
            />
            <ContextMenuSection label='Add a continuation' />
            <ContextMenuItem label='Prerequisite' iconName='arrow-down-left' onPress={() => null} />
            <ContextMenuItem label='Consequence' iconName='arrow-up-right' onPress={() => null} />
          </Popover>
        </>
      )}
    </>
  )
}
