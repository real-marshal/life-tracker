import { BottomSheetView } from '@gorhom/bottom-sheet'
import { Text, View } from 'react-native'

type GoalStatusAction = 'abandon' | 'complete'

const actionLabelMap: Record<GoalStatusAction, string> = {
  abandon: 'Abandon the goal',
  complete: 'Complete the goal',
}

export function GoalSheet({ id, action }: { id: number; action: GoalStatusAction }) {
  return (
    <BottomSheetView className='pb-safe-offset-4 px-4'>
      <View className='flex flex-row justify-center items-center relative'>
        <Text className='text-accent font-bold text-center text-lg'>{actionLabelMap[action]}</Text>
      </View>
    </BottomSheetView>
  )
}
