import { useCallback, useState } from 'react'
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

export function useContextMenu() {
  const [isPopoverShown, setIsShown] = useState(false)

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0)

  const showPopover = () => {
    setIsShown(true)
    opacity.value = withTiming(1, { duration: 50 })
    scale.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 100 })
    )
  }

  const hidePopover = useCallback(() => {
    opacity.value = withTiming(
      0,
      { duration: 200 },
      (finished) => finished && runOnJS(setIsShown)(false)
    )
    scale.value = withTiming(0, { duration: 200 })
  }, [opacity, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    transformOrigin: 'top right',
  }))

  return { isPopoverShown, showPopover, hidePopover, animatedStyle }
}
