import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { colors } from '@/common/theme'

export function SheetBackdrop({ animatedIndex }: BottomSheetBackdropProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.bg,
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: interpolate(animatedIndex.value, [-1, 0], [0, 0.7]),
  }))

  return <Animated.View style={animatedStyle} />
}
