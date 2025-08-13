import { Text, TextInput, View, ViewStyle } from 'react-native'

import { colors, goalUpdateColorMap } from '@/common/theme'
import { GoalUpdate } from '@/models/goalUpdate'
import { Popover } from '@/components/Popover'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { RefObject, useCallback, useMemo, useRef, useState } from 'react'
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
import { uses24hourClock } from '@/common/utils/date'

export function GoalUpdateRecord({
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

  const onCancelRef = useRef(() => {})

  const onContextMenu = useCallback(() => {
    performContextMenuHaptics()

    onContextMenuCancelRef.current !== onCancelRef.current && onContextMenuCancelRef.current()

    onContextMenuCancelRef.current = onCancelRef.current
    onModalCancelRef.current = () => {
      setEditable(false)
      setValue(content)
    }

    setTimeout(() => showPopover(), 0)
  }, [content, onCancelRef, onContextMenuCancelRef, onModalCancelRef, showPopover])

  const {
    gesture,
    resetAnimation,
    animatedStyle: contentAnimatedStyle,
  } = useGoalUpdateRecordAnimation(onContextMenu, {
    borderColor: goalUpdateColorMap[sentiment],
  })

  onCancelRef.current = useCallback(() => {
    hidePopover()
    resetAnimation()
  }, [hidePopover, resetAnimation])

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
              if (isNew && value) {
                return onAddGoalUpdate(value)
              }
              if (value !== content) {
                setEditable(false)
                onUpdateGoalUpdate(value)
              } else {
                setValue(content)
                setEditable(false)
              }
            }}
          />
        </View>
      ) : (
        <>
          <GestureDetector gesture={gesture}>
            <Animated.View
              className='bg-bgSecondary p-3 border-l-2 rounded-md leading-5'
              style={contentAnimatedStyle}
            >
              <Text className='text-fg'>{value}</Text>
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

function useGoalUpdateRecordAnimation(onStart: () => void, style: ViewStyle) {
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
