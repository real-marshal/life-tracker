import { View, Text, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getGoal, getLtGoal, Goal, LtGoal } from '@/models/goal'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { colors, goalStatusColorMap, goalUpdateColorMap } from '@/common/theme'
import Feather from '@expo/vector-icons/Feather'
import { formatDateSmart, formatDurationTwoLongValues, makeDateTz } from '@/common/utils/date'
import { Trackers } from '@/components/Tracker/Trackers'
import { GoalPreviewItem } from '@/components/Goals'
import {
  addGoalUpdate,
  deleteGoalUpdate,
  getGoalUpdates,
  GoalUpdate,
  updateGoalUpdate,
  UpdateGoalUpdateParam,
} from '@/models/goalUpdate'
import { getCalendars } from 'expo-localization'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FloatingButton, FloatingMenuItem } from '@/components/FloatingMenu'
import { Popover } from '@/components/Popover'
import { useFloatingMenu } from '@/hooks/useFloatingMenu'
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler'
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useModal } from '@/components/Modal'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ContextMenuItem } from '@/components/ContextMenu'
import { performContextMenuHaptics } from '@/common/utils/haptics'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

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
  const { data: goalUpdatesSaved, error: goalUpdatesError } = useQuery({
    queryKey: ['goalUpdates', id],
    queryFn: () => getGoalUpdates(db, Number.parseInt(id as string)),
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

  const [goalUpdates, setGoalUpdates] = useState(goalUpdatesSaved)

  useEffect(() => {
    setGoalUpdates(goalUpdatesSaved)
  }, [goalUpdatesSaved])

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

  const onContextMenuCancel = useRef<() => void>(() => null)
  const onModalCancelRef = useRef<() => void>(() => null)

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = useFloatingMenu()

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

  const onAddGoalUpdate = (sentiment: GoalUpdate['sentiment']) => {
    hidePopover()

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

  const onAddConfirm = useRef<() => void>(null)
  const onDeleteConfirm = useRef<() => void>(null)
  const onUpdateConfirm = useRef<() => void>(null)

  const accentColor =
    goal?.status && goal.status !== 'active'
      ? goalStatusColorMap[goal.status]
      : isLongTerm
        ? colors.ltGoal
        : colors.currentGoal

  return (
    <>
      <Pressable
        onPress={() => {
          hidePopover()
          onContextMenuCancel.current()
        }}
      >
        <KeyboardAwareScrollView bottomOffset={10}>
          <View
            className='m-safe p-3 pb-5 flex flex-col gap-6 min-h-screen'
            onStartShouldSetResponder={() => true}
          >
            <View className='flex flex-row gap-2 items-center justify-between'>
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
              <Feather name='more-horizontal' size={24} color={accentColor} />
            </View>
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
              {Object.values(goalUpdatesByDate).map((dateGoalUpdates) => {
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
                            onDeleteConfirm.current = () => deleteGoalUpdateMutator(goalUpdate.id)
                          }}
                          onUpdateGoalUpdate={(newContent) => {
                            showUpdateModal()
                            onUpdateConfirm.current = () =>
                              updateGoalUpdateMutator({ id: goalUpdate.id, content: newContent })
                          }}
                          onContextMenuCancelRef={onContextMenuCancel}
                          onModalCancelRef={onModalCancelRef}
                        />
                      ))}
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </Pressable>
      {goal?.status === 'active' && (
        <>
          <FloatingButton
            onPress={() => (isPopoverShown ? hidePopover() : showPopover())}
            color={isLongTerm ? colors.ltGoal : colors.currentGoal}
            activeColor={isLongTerm ? colors.ltGoalActive : colors.currentGoalActive}
            active={isPopoverShown}
          />
          <Popover
            isOpen={isPopoverShown}
            className='right-safe-offset-7 bottom-[90px] z-[9999999]'
            animatedStyle={animatedStyle}
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
          />
          <ConfirmModal
            text='Update this goal update?'
            hideModal={hideUpdateModal}
            modalProps={updateModalProps}
            onConfirm={() => onUpdateConfirm.current?.()}
          />
        </>
      )}
    </>
  )
}

function GoalUpdateRecord({
  id,
  content,
  createdAt,
  sentiment,
  onAddGoalUpdate,
  onDeleteGoalUpdate,
  onUpdateGoalUpdate,
  onContextMenuCancelRef,
  onModalCancelRef,
}: GoalUpdate & {
  onAddGoalUpdate: (value: string) => void
  onDeleteGoalUpdate: () => void
  onUpdateGoalUpdate: (newContent: string) => void
  onContextMenuCancelRef: RefObject<() => void>
  onModalCancelRef: RefObject<() => void>
}) {
  const isNew = id === -1

  const [value, setValue] = useState(content)
  const [editable, setEditable] = useState(isNew)

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = useContextMenu()

  const onContextMenu = () => {
    performContextMenuHaptics()

    onContextMenuCancelRef.current !== onCancel && onContextMenuCancelRef.current()

    onContextMenuCancelRef.current = onCancel
    onModalCancelRef.current = () => {
      setEditable(false)
      setValue(content)
    }

    setTimeout(() => showPopover(), 0)
  }

  const {
    gesture,
    resetAnimation,
    animatedStyle: contentAnimatedStyle,
  } = useGoalUpdateRecordAnimation(onContextMenu)

  const onCancel = useCallback(() => {
    hidePopover()
    resetAnimation()
  }, [hidePopover, resetAnimation])

  const time = isNew
    ? 'Now'
    : createdAt.date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: !getCalendars()[0].uses24hourClock,
      })

  return (
    <View className='flex flex-col gap-1 relative'>
      <Text className='text-fgSecondary text-xs'>{time}</Text>
      {editable ? (
        <View
          className='bg-bgTertiary p-3 border-l-2 rounded-md leading-5'
          style={{ borderColor: goalUpdateColorMap[sentiment] }}
        >
          <TextInput
            onChangeText={setValue}
            value={value}
            multiline
            autoFocus
            className='text-fg p-0'
            textAlignVertical='top'
            scrollEnabled={false}
            onBlur={() => (isNew ? onAddGoalUpdate(value) : onUpdateGoalUpdate(value))}
          />
        </View>
      ) : (
        <>
          <GestureDetector gesture={gesture}>
            <Animated.View
              className='bg-bgSecondary p-3 border-l-2 rounded-md leading-5'
              style={[
                contentAnimatedStyle,
                {
                  borderColor: goalUpdateColorMap[sentiment],
                },
              ]}
            >
              <Text className='text-fg'>{content}</Text>
            </Animated.View>
          </GestureDetector>
          <Popover
            isOpen={isPopoverShown}
            className='top-10 left-0 z-[9999999]'
            animatedStyle={animatedStyle}
          >
            <ContextMenuItem
              label='Edit'
              iconName='edit-3'
              onPress={() => {
                hidePopover()
                setEditable(true)
                resetAnimation()
              }}
              rnPressable
            />
            <ContextMenuItem
              label='Delete goal update'
              iconName='trash'
              color={colors.negative}
              onPress={() => {
                hidePopover()
                onDeleteGoalUpdate()
                resetAnimation()
              }}
              last
              rnPressable
            />
          </Popover>
        </>
      )}
    </View>
  )
}

function useGoalUpdateRecordAnimation(onStart: () => void) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const bgColor = useSharedValue(colors.bgSecondary)
  const hasLongPressStarted = useSharedValue(false)

  const resetAnimation = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 })
    opacity.value = withTiming(1, { duration: 150 })
    bgColor.value = colors.bgSecondary
  }, [scale, opacity, bgColor])

  const gesture = Gesture.LongPress()
    .minDuration(250)
    .onTouchesDown(() => {
      scale.value = withDelay(200, withTiming(0.95, { duration: 100 }))
      opacity.value = withDelay(200, withTiming(0.8, { duration: 100 }))
      bgColor.value = withDelay(100, withTiming(colors.bgTertiary, { duration: 250 }))
    })
    .onStart(() => {
      hasLongPressStarted.value = true

      bgColor.value = colors.bgTertiary

      runOnJS(onStart)()
    })
    .onFinalize(() => {
      if (hasLongPressStarted.value) {
        hasLongPressStarted.value = false
        return
      }

      scale.value = withTiming(1, { duration: 150 })
      opacity.value = withTiming(1, { duration: 150 })
      bgColor.value = colors.bgSecondary
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: bgColor.value,
  }))

  return { gesture, resetAnimation, animatedStyle }
}
