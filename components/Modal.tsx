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
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { cn } from '@/common/utils/css'
import { Backdrop } from '@/components/Backdrop'

export function Modal({
  children,
  onCancel,
  isModalShown,
  opacitySharedValue,
  scaleSharedValue,
  animatedStyle,
  containerClassName,
  onPress,
}: {
  isModalShown: boolean
  children: ReactNode
  onCancel?: () => void
  opacitySharedValue: SharedValue<number>
  scaleSharedValue: SharedValue<number>
  animatedStyle: AnimatedStyle<ViewStyle>
  containerClassName?: string
  onPress?: () => void
}) {
  return (
    <RNModal transparent visible={isModalShown} onRequestClose={onCancel} animationType='none'>
      <>
        {onPress && <Backdrop onPress={onPress} overlay />}
        <ModalContent
          opacitySharedValue={opacitySharedValue}
          scaleSharedValue={scaleSharedValue}
          animatedStyle={animatedStyle}
          containerClassName={containerClassName}
        >
          {children}
        </ModalContent>
      </>
    </RNModal>
  )
}

function ModalContent({
  children,
  opacitySharedValue,
  scaleSharedValue,
  animatedStyle,
  containerClassName,
}: {
  children: ReactNode
  opacitySharedValue: SharedValue<number>
  scaleSharedValue: SharedValue<number>
  animatedStyle: AnimatedStyle<ViewStyle>
  containerClassName?: string
}) {
  useEffect(() => {
    opacitySharedValue.value = withTiming(1, { duration: 50 })
    scaleSharedValue.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 100 })
    )
  }, [opacitySharedValue, scaleSharedValue])

  return (
    <View className='flex flex-col items-center justify-center flex-1'>
      <Animated.View
        className={cn(
          'flex flex-col items-center justify-center bg-bgSecondary px-8 pb-8 pt-7 rounded-lg border-hairline border-[#444] gap-6 m-10 z-[9999]',
          containerClassName
        )}
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
  }, [opacity, scale])

  const hideModal = useCallback(
    (isCanceling?: boolean) => {
      scale.value = withTiming(0, { duration: 200 }, (finished) => {
        finished && runOnJS(setIsShown)(false)
        isCanceling && onCancelPassed && runOnJS(onCancelPassed)()
      })
      opacity.value = withTiming(0, { duration: 200 })
    },
    [onCancelPassed, opacity, scale]
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return {
    isModalShown,
    showModal: useCallback(() => setIsShown(true), []),
    onCancel: () => hideModal(true),
    hideModal: useCallback(() => hideModal(), [hideModal]),
    opacitySharedValue: opacity,
    scaleSharedValue: scale,
    animatedStyle,
  }
}

export type RestModalProps = Omit<ReturnType<typeof useModal>, 'showModal' | 'hideModal'>
