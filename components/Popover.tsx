import Animated from 'react-native-reanimated'
import { ReactNode } from 'react'
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
