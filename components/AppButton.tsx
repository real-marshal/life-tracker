import { Pressable, Text } from 'react-native'

export function AppButton({
  text,
  onPress,
  color,
  activeColor,
}: {
  text: string
  onPress: () => void
  color: string
  activeColor: string
}) {
  return (
    <Pressable onPress={onPress} className='flex flex-row grow-0 shrink bg-bgTertiary self-center'>
      {({ pressed }) => (
        <Text
          className='p-3 px-12 text-center rounded-md font-medium text-lg'
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
