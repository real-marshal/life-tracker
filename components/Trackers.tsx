import { Pressable, Text, View } from 'react-native'
import { getStatTracker, Tracker } from '@/models/tracker'
import { formatDurationShort } from '@/common/utils/date'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useRef } from 'react'
import { colors } from '@/common/theme'
import { LineChart } from '@/components/LineChart/LineChart'
import Feather from '@expo/vector-icons/Feather'
import { useLoader } from '@/hooks/useLoader'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'

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
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  const onTrackerPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const shownValue =
    typeSpecificData.type === 'date'
      ? formatDurationShort(typeSpecificData.duration)
      : `${typeSpecificData.prefix ?? ''}${typeSpecificData.value}${typeSpecificData.suffix ?? ''}`

  return (
    <>
      <Pressable
        className='flex flex-row grow gap-2 bg-bgTertiary p-2 px-4 rounded-lg justify-between'
        style={isLast && { width: '50%', flexGrow: 0 }}
        onPress={onTrackerPress}
      >
        <Text className='text-fgSecondary'>{name}:</Text>
        <Text className='text-fg font-bold'>{shownValue}</Text>
      </Pressable>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        backgroundStyle={{
          backgroundColor: colors.bgSecondary,
          borderRadius: 40,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.accent, width: 100, height: 3 }}
      >
        <TrackerSheet id={id} />
      </BottomSheetModal>
    </>
  )
}

function TrackerSheet({ id }: { id: number }) {
  const db = useSQLiteContext()
  const [statTracker, , statTrackerError] = useLoader(getStatTracker, db, id)

  useErrorToasts({ title: 'Error loading a stat tracker', errorData: statTrackerError })

  return (
    <BottomSheetView className='flex flex-col pb-safe-offset-4 px-4 gap-4'>
      <Text className='text-accent font-bold text-center text-lg'>{statTracker?.name}</Text>
      <LineChart data={statTracker?.values ?? []} x='date' y='value' />
      <View className='flex flex-col gap-4 items-center my-4'>
        <View className='flex flex-row gap-4'>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-1</Text>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-10</Text>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-100</Text>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-1000</Text>
        </View>
        <View className='flex flex-row gap-2 items-center px-8 py-4 bg-bgTertiary rounded-lg'>
          <Text className='text-fg font-bold'>{`${statTracker?.prefix ?? ''}${statTracker?.values.at(-1)?.value}${statTracker?.suffix ?? ''}`}</Text>
          <Pressable onPress={() => null}>
            <Feather name='edit-2' size={16} color={colors.fg} />
          </Pressable>
        </View>
        <View className='flex flex-row gap-4'>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+1</Text>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+10</Text>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+100</Text>
          <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+1000</Text>
        </View>
      </View>
    </BottomSheetView>
  )
}
