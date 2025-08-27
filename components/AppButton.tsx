import { Pressable, Text } from 'react-native'
import { cn } from '@/common/utils/css'

export function AppButton({
  text,
  onPress,
  color,
  activeColor,
  className,
}: {
  text: string
  onPress: () => void
  color: string
  activeColor: string
  className?: string
}) {
  return (
    <Pressable onPress={onPress} className='flex flex-row bg-bgTertiary self-center'>
      {({ pressed }) => (
        <Text
          className={cn('p-3 px-12 text-center rounded-md font-medium text-lg', className)}
          style={{
            backgroundColor: pressed ? activeColor : color,
          }}
        >
          {text}
        </Text>
      )}
    </Pressable>
  )
}
