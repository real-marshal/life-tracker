import { Modal as RNModal, View, ViewStyle } from 'react-native'
import Animated, {
  AnimatedStyle,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { ReactNode, useEffect, useState } from 'react'

export function Modal({
  children,
  onCancel,
  isModalShown,
  opacitySharedValue,
  scaleSharedValue,
  animatedStyle,
}: {
  isModalShown: boolean
  children: ReactNode
  onCancel?: () => void
  opacitySharedValue: SharedValue<number>
  scaleSharedValue: SharedValue<number>
  animatedStyle: AnimatedStyle<ViewStyle>
}) {
  return (
    <RNModal transparent visible={isModalShown} onRequestClose={onCancel} animationType='none'>
      <ModalContent
        opacitySharedValue={opacitySharedValue}
        scaleSharedValue={scaleSharedValue}
        animatedStyle={animatedStyle}
      >
        {children}
      </ModalContent>
    </RNModal>
  )
}

function ModalContent({
  children,
  opacitySharedValue,
  scaleSharedValue,
  animatedStyle,
}: {
  children: ReactNode
  opacitySharedValue: SharedValue<number>
  scaleSharedValue: SharedValue<number>
  animatedStyle: AnimatedStyle<ViewStyle>
}) {
  useEffect(() => {
    opacitySharedValue.value = withTiming(1, { duration: 50 })
    scaleSharedValue.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 100 })
    )
  }, [])

  return (
    <View className='flex flex-col items-center justify-center bg-[rgba(0,0,0,0.5)] flex-1'>
      <Animated.View
        className='flex flex-col items-center justify-center bg-bgSecondary px-8 pb-8 pt-7 rounded-lg border-hairline border-[#444] gap-6'
        style={animatedStyle}
      >
        {children}
      </Animated.View>
    </View>
  )
}

export function useModal(onCancelPassed?: () => void) {
  const [isModalShown, setIsShown] = useState(false)

  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 50 })
    scale.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 100 })
    )
  }, [])

  const hideModal = (isCanceling?: boolean) => {
    scale.value = withTiming(0, { duration: 200 }, (finished) => {
      finished && runOnJS(setIsShown)(false)
      isCanceling && onCancelPassed && runOnJS(onCancelPassed)()
    })
    opacity.value = withTiming(0, { duration: 200 })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return {
    isModalShown,
    showModal: () => setIsShown(true),
    onCancel: () => hideModal(true),
    hideModal: () => hideModal(),
    opacitySharedValue: opacity,
    scaleSharedValue: scale,
    animatedStyle,
  }
}
