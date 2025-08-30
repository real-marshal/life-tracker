import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'

export function AnimatedChevron({ size, invert = false }: { size: number; invert?: boolean }) {
  const rot = useSharedValue(0)

  useEffect(() => {
    rot.value = withTiming(invert ? 1 : 0, { duration: 300 })
  }, [invert, rot])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rot.value, [0, 1], [0, 180])}deg` }],
  }))

  return (
    <Animated.View style={animatedStyle}>
      <Feather name='chevron-down' size={size} color={colors.fgSecondary} />
    </Animated.View>
  )
}
