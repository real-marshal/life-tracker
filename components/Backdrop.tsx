import { cn } from '@/common/utils/css'
import { TouchableWithoutFeedback, View } from 'react-native'

export function Backdrop({
  onPress,
  overlay,
  className,
}: {
  onPress: () => void
  overlay?: boolean
  className?: string
}) {
  return (
    // no, RNGH's version doesn't work, nor Pressable...
    <TouchableWithoutFeedback onPress={onPress}>
      <View
        className={cn(
          'absolute top-0 left-0 right-0 bottom-0 z-[999]',
          {
            'bg-[rgba(0,0,0,0.4)]': overlay,
          },
          className
        )}
      />
    </TouchableWithoutFeedback>
  )
}
