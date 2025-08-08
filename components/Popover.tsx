import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { ReactNode, useState } from 'react'
import { AnimatedStyle } from 'react-native-reanimated/src/commonTypes'
import { ViewStyle } from 'react-native'

export function Popover({
  isOpen,
  children,
  className,
  animatedStyle,
}: {
  isOpen: boolean
  children: ReactNode
  className?: string
  animatedStyle?: AnimatedStyle<ViewStyle>
}) {
  if (!isOpen) return null

  return (
    <Animated.View
      className={`flex flex-col bg-bgSecondary rounded-lg border-hairline border-bgTertiary absolute ${className ?? ''}`}
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  )
}

export function usePopover() {
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
    transformOrigin: 'top right',
  }))

  return { isPopoverShown, showPopover, hidePopover, animatedStyle }
}
