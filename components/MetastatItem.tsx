import { MetaStat } from '@/models/metastat'
import { Text, View } from 'react-native'

export function MetastatItem({ id, name, value, level }: MetaStat) {
  return (
    <View key={id} className='flex flex-row gap-3 justify-between items-center'>
      <View className='flex flex-row gap-2 min-w-32 justify-between'>
        <Text className='text-fg'>{name}</Text>
        {typeof level === 'number' && <Text className='text-fg'>{level}</Text>}
      </View>
      <View className='flex-grow h-[hairlineWidth()] bg-fgSecondary relative rounded-sm'>
        <View
          className='h-[3] bg-fg absolute top-[-1] rounded-sm'
          style={{ width: `${value * 100}%` }}
        />
      </View>
    </View>
  )
}
