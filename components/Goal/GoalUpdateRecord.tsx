import { Text, TextInput, View, ViewStyle } from 'react-native'

import { colors, goalUpdateColorMap } from '@/common/theme'
import { GoalUpdate } from '@/models/goalUpdate'
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  LongPressGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { uses24hourClock } from '@/common/utils/date'
import { performContextMenuHaptics } from '@/common/utils/haptics'
import { NEW_ID } from '@/components/Goal/constants'

function GoalUpdateRecordUnmemoed({
  id,
  content,
  createdAt,
  sentiment,
  editable,
  onContextMenu,
  onSubmit,
}: GoalUpdate & {
  onContextMenu: ({
    event,
    resetAnimation,
  }: {
    event: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>
    resetAnimation: () => void
  }) => void
  editable?: boolean
  onSubmit: (newContent?: string) => void
}) {
  const isNew = id === NEW_ID

  const [value, setValue] = useState(content)

  useEffect(() => {
    !editable && setValue(content)
  }, [content, editable])

  const onAnimationStartRef = useRef<
    (event: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => void
  >(() => {})

  const {
    gesture,
    resetAnimation,
    animatedStyle: contentAnimatedStyle,
  } = useGoalUpdateRecordAnimation((e) => onAnimationStartRef.current(e), {
    borderColor: goalUpdateColorMap[sentiment],
  })

  onAnimationStartRef.current = useCallback(
    (event: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => {
      onContextMenu({ event, resetAnimation })
    },
    [onContextMenu, resetAnimation]
  )

  const time = isNew
    ? 'Now'
    : createdAt.date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: !uses24hourClock,
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
            onBlur={() => {
              if ((isNew && value) || value !== content) {
                onSubmit(value)
              } else {
                setValue(content)
                onSubmit()
              }
            }}
          />
        </View>
      ) : (
        <GestureDetector gesture={gesture}>
          <Animated.View
            className='bg-bgSecondary p-3 border-l-2 rounded-md leading-5'
            style={contentAnimatedStyle}
          >
            <Text className='text-fg'>{value}</Text>
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  )
}

function useGoalUpdateRecordAnimation(
  onStart: (event: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => void,
  style: ViewStyle
) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const bgColor = useSharedValue(colors.bgSecondary)
  const hasLongPressStarted = useSharedValue(false)

  const resetAnimation = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 })
    opacity.value = withTiming(1, { duration: 150 })
    bgColor.value = colors.bgSecondary
  }, [scale, opacity, bgColor])

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(250)
        .onTouchesDown(() => {
          scale.value = withDelay(200, withTiming(0.95, { duration: 100 }))
          opacity.value = withDelay(200, withTiming(0.8, { duration: 100 }))
          bgColor.value = withDelay(100, withTiming(colors.bgTertiary, { duration: 250 }))
        })
        .onStart((event) => {
          hasLongPressStarted.value = true

          bgColor.value = colors.bgTertiary

          runOnJS(onStart)(event)
        })
        .onFinalize(() => {
          if (hasLongPressStarted.value) {
            hasLongPressStarted.value = false
            return
          }

          scale.value = withTiming(1, { duration: 150 })
          opacity.value = withTiming(1, { duration: 150 })
          bgColor.value = colors.bgSecondary
        }),
    [bgColor, hasLongPressStarted, onStart, opacity, scale]
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: bgColor.value,
    ...style,
  }))

  return { gesture, resetAnimation, animatedStyle }
}

export const GoalUpdateRecord = memo(GoalUpdateRecordUnmemoed)

// exists solely to make onContextMenu and onSubmit stable to facilitate memo()
// (can't execute hooks in a loop so this became a separate component)
export function GoalUpdateRecordWrapper({
  id,
  content,
  createdAt,
  sentiment,
  editable,
  type,
  isPinned,
  setGoalUpdateModificationState,
  setGoalUpdateContextMenuPosition,
  onContextMenuCancelRef,
  showContextMenu,
  setGoalUpdates,
  showSaveNewModal,
  showUpdateModal,
}: GoalUpdate & {
  editable?: boolean
  setGoalUpdateModificationState: (state: any) => void
  setGoalUpdateContextMenuPosition: (state: any) => void
  onContextMenuCancelRef: RefObject<() => void>
  showContextMenu: () => void
  showSaveNewModal: () => void
  showUpdateModal: () => void
  setGoalUpdates: (state: any) => void
  type: GoalUpdate['type']
  isPinned: boolean
}) {
  const onContextMenu = useCallback(
    ({
      event,
      resetAnimation,
    }: {
      event: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>
      resetAnimation: () => void
    }) => {
      setGoalUpdateModificationState({ id })
      setGoalUpdateContextMenuPosition(event.absoluteY)

      onContextMenuCancelRef.current !== resetAnimation && onContextMenuCancelRef.current()
      onContextMenuCancelRef.current = resetAnimation

      showContextMenu()
      performContextMenuHaptics()
    },
    [
      id,
      onContextMenuCancelRef,
      setGoalUpdateContextMenuPosition,
      setGoalUpdateModificationState,
      showContextMenu,
    ]
  )

  const onSubmit = useCallback(
    (newContent?: string) => {
      const isAdding = id === NEW_ID

      if (isAdding) {
        if (!newContent) {
          setGoalUpdates((goalUpdates: GoalUpdate[]) =>
            goalUpdates?.filter((goalUpdate) => goalUpdate.id !== NEW_ID)
          )

          return setGoalUpdateModificationState(undefined)
        }

        setGoalUpdateModificationState({
          id: NEW_ID,
          editable: true,
          modification: {
            type: 'create',
            content: newContent,
          },
        })
        return showSaveNewModal()
      }

      if (!newContent) {
        return setGoalUpdateModificationState(undefined)
      }

      showUpdateModal()

      setGoalUpdateModificationState({
        id,
        editable: true,
        modification: {
          type: 'update',
          newContent,
        },
      })
    },
    [id, setGoalUpdateModificationState, setGoalUpdates, showSaveNewModal, showUpdateModal]
  )

  return (
    <GoalUpdateRecord
      id={id}
      editable={editable}
      content={content}
      createdAt={createdAt}
      sentiment={sentiment}
      type={type}
      isPinned={isPinned}
      onContextMenu={onContextMenu}
      onSubmit={onSubmit}
    />
  )
}
