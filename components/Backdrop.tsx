import { TouchableWithoutFeedback, View } from 'react-native'

export function Backdrop({ onPress }: { onPress: () => void }) {
  return (
    // no, RNGH's version doesn't work, nor Pressable...
    <TouchableWithoutFeedback onPress={onPress}>
      <View className='absolute top-0 left-0 right-0 bottom-0 z-[999]' />
    </TouchableWithoutFeedback>
  )
}
