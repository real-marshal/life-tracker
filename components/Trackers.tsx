import { Text, View } from 'react-native'
import { Tracker } from '@/models/tracker'
import { formatDurationShort } from '@/common/utils/date'

export function Trackers({ trackers }: { trackers: Tracker[] }) {
  return (
    <View className='flex flex-row gap-2 flex-wrap'>
      {trackers?.map((tracker, ind) => (
        <TrackerItem {...tracker} key={tracker.id} isLast={ind === trackers.length - 1} />
      ))}
    </View>
  )
}

function TrackerItem({
  isLast,
  id,
  name,
  renderData,
  ...typeSpecificData
}: Tracker & { isLast: boolean }) {
  const shownValue =
    typeSpecificData.type === 'date'
      ? formatDurationShort(typeSpecificData.duration)
      : `${typeSpecificData.prefix ?? ''}${typeSpecificData.value}${typeSpecificData.suffix ?? ''}`

  return (
    <View
      className='flex flex-row grow gap-2 bg-bgTertiary p-2 px-4 rounded-lg justify-between'
      style={isLast && { width: '50%', flexGrow: 0 }}
    >
      <Text className='text-fgSecondary'>{name}:</Text>
      <Text className='text-fg font-bold'>{shownValue}</Text>
    </View>
  )
}
