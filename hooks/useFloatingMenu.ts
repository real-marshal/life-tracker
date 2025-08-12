import { useState } from 'react'
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

export function useFloatingMenu() {
  const [isPopoverShown, setIsShown] = useState(false)

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0)

  const showPopover = () => {
    setIsShown(true)
    opacity.value = withTiming(1, { duration: 50 })
    scale.value = withSequence(withTiming(1, { duration: 200 }))
  }

  const hidePopover = () => {
    opacity.value = withTiming(
      0,
      { duration: 200 },
      (finished) => finished && runOnJS(setIsShown)(false)
    )
    scale.value = withTiming(0, { duration: 200 })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    transformOrigin: 'bottom right',
  }))

  return { isPopoverShown, showPopover, hidePopover, animatedStyle }
}
