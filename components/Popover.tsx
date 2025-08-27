import Animated, { AnimatedStyle } from 'react-native-reanimated'
import { ReactNode } from 'react'
import { ViewStyle } from 'react-native'

export function Popover({
  isOpen,
  children,
  className,
  animatedStyle,
  style,
}: {
  isOpen: boolean
  children: ReactNode
  className?: string
  animatedStyle?: AnimatedStyle<ViewStyle>
  style?: ViewStyle
}) {
  if (!isOpen) return null

  return (
    <Animated.View
      className={`flex flex-col bg-bgSecondary rounded-lg border-hairline border-bgTertiary absolute ${className ?? ''}`}
      style={[animatedStyle, style]}
    >
      {children}
    </Animated.View>
  )
}
