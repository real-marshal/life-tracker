import { Text, View, ViewStyle } from 'react-native'
import { ReactNode, useEffect, useState } from 'react'
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Pressable } from 'react-native-gesture-handler'
import { cn } from '@/common/utils/css'
import { AnimatedChevron } from '@/components/AnimatedChevron'

export function Expandable({
  title,
  children,
}: {
  title: string
  children: ReactNode | ((animatedStyle: ViewStyle) => ReactNode)
}) {
  const [isExpanded, setExpanded] = useState(false)
  const [itemWidth, setItemWidth] = useState(0)

  return (
    <Animated.View layout={LinearTransition}>
      <View className='flex flex-row gap-6 items-center justify-between'>
        <Pressable onPress={() => setExpanded((isExpanded) => !isExpanded)} style={{ flex: 1 }}>
          <View
            className={cn(
              'flex flex-row justify-between items-center bg-bgSecondary active:bg-bgTertiary rounded-t-md p-4',
              {
                'rounded-b-md': !isExpanded,
              }
            )}
            onLayout={(e) => !itemWidth && setItemWidth(e.nativeEvent.layout.width)}
          >
            <Text className='text-fg text-lg'>{title}</Text>
            <AnimatedChevron size={24} invert={isExpanded} />
          </View>
        </Pressable>
      </View>
      <ExpandableChildren width={itemWidth} expanded={isExpanded}>
        {children}
      </ExpandableChildren>
    </Animated.View>
  )
}

function ExpandableChildren({
  width,
  expanded,
  children,
}: {
  width: number
  expanded: boolean
  children: ReactNode | ((animatedStyle: ViewStyle) => ReactNode)
}) {
  const opacity = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    opacity.value = withTiming(expanded ? 1 : 0, { duration: 300 })
  }, [expanded, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    width,
  }))

  if (!expanded) return null

  return typeof children === 'function' ? (
    children(animatedStyle)
  ) : (
    <Animated.View className='flex bg-bgSecondary rounded-b-md' style={animatedStyle}>
      {children}
    </Animated.View>
  )
}
