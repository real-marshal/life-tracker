import { Pressable, Text, View } from 'react-native'
import { Backdrop } from './Backdrop'
import { ReactNode, useEffect, useState } from 'react'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { cn } from '@/common/utils/css'

export function OnboardingTooltip<T extends string>({
  renderTooltip,
  label,
  isShown,
  isLast,
  children,
  nextTooltip,
  borderClassName,
  top,
}: {
  isShown: (label: T) => boolean
  isLast: boolean
  renderTooltip: ({ isLast }: { isLast: boolean }) => ReactNode
  label: T
  children: ReactNode
  nextTooltip: () => void
  borderClassName?: string
  top?: boolean
}) {
  const opacity = useSharedValue(0)
  const shouldShow = isShown(label)

  useEffect(() => {
    if (shouldShow) {
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      opacity.value = withTiming(0, { duration: 200 })
    }
  }, [shouldShow, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  if (!shouldShow) return children

  return (
    <View className='relative'>
      <Animated.View className='z-[1000]' style={animatedStyle}>
        <View
          className={cn(
            'absolute -top-3 -right-1 -bottom-3 -left-1 border-2 border-fgSecondary rounded-md',
            borderClassName
          )}
        ></View>
        {children}
        <View
          className={cn(
            'absolute w-[320] bg-bgSecondary overflow-hidden px-5 py-4 border-bgTertiary border-hairline right-1 gap-4 rounded-lg',
            { 'bottom-full mb-6': top, 'top-full mt-6': !top }
          )}
        >
          {renderTooltip({ isLast })}
          <Pressable
            className='flex flex-row items-center gap-2 self-end'
            onPress={nextTooltip}
            hitSlop={4}
          >
            {({ pressed }) => (
              <>
                <Text
                  className={cn('text-accent font-bold text-lg', { 'text-accentActive': pressed })}
                >
                  {isLast ? 'Finish' : 'Continue'}
                </Text>
                <Feather
                  name={isLast ? 'check' : 'arrow-right'}
                  size={20}
                  color={pressed ? colors.accentActive : colors.accent}
                />
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
      <Backdrop onPress={() => null} className='-top-[1000] -left-96 h-[5000] w-[2000]' overlay />
    </View>
  )
}

export function useOnboardingTooltips<T extends string>({
  labels,
  areShown,
  onFinish,
}: {
  labels: T[]
  areShown: boolean
  onFinish: () => void
}) {
  const [currentInd, setCurrentInd] = useState<number>(0)

  const isLast = currentInd >= labels.length - 1

  useEffect(() => {
    setCurrentInd(0)
  }, [areShown])

  return {
    isShown: (label: T) => areShown && label === labels[currentInd],
    isLast,
    nextTooltip: () => {
      if (isLast) {
        onFinish()
      }

      setCurrentInd((ind) => ind + 1)
    },
  }
}
