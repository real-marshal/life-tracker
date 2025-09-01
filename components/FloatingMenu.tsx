import { Pressable, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { cn } from '@/common/utils/css'
import { ReactNode, useEffect } from 'react'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

export function FloatingMenuItem({
  description,
  onPress,
  last,
  children,
}: {
  description: string
  onPress: () => void
  last?: boolean
  children: ReactNode
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          className={cn('flex flex-col pl-5 pr-8 py-3 border-bgTertiary', {
            'bg-bgTertiary': pressed,
            'rounded-b-lg': last,
            'border-b-hairline': !last,
          })}
        >
          <Text>{children}</Text>
          <Text className='text-sm text-fgSecondary font-medium'>{description}</Text>
          {/*<Feather name={iconName} size={iconSize} color={color} />*/}
        </View>
      )}
    </Pressable>
  )
}

function FloatingMenuItemText({
  children,
  color = colors.fg,
}: {
  children: ReactNode
  color?: string
}) {
  return (
    <Text className='text-xl font-bold' style={{ color: color }}>
      {children}
    </Text>
  )
}

FloatingMenuItem.Text = FloatingMenuItemText

export function FloatingButton({
  onPress,
  color,
  activeColor,
  active,
}: {
  onPress: () => void
  color: string
  activeColor: string
  active?: boolean
}) {
  const rot = useSharedValue(0)

  useEffect(() => {
    rot.value = withTiming(active ? 1 : 0, { duration: 150 })
  }, [active, rot])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rot.value, [0, 1], [0, 45])}deg` }],
  }))

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          className='p-[14px] rounded-full absolute right-safe-offset-6 bottom-safe-offset-6'
          style={{ backgroundColor: pressed || active ? activeColor : color }}
        >
          <Animated.View style={animatedStyle}>
            <Feather name='plus' size={26} color={colors.bg} />
          </Animated.View>
        </View>
      )}
    </Pressable>
  )
}
