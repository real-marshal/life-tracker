import { Pressable, Text, View } from 'react-native'
import { DateTracker, StatTracker, Tracker } from '@/models/tracker'
import { formatDurationShort } from '@/common/utils/date'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { colors } from '@/common/theme'
import { StatTrackerSheet } from '@/components/Tracker/StatTrackerSheet'
import { SheetModal } from '@/components/SheetModal'
import { DateTrackerSheet } from '@/components/Tracker/DateTrackerSheet'
import { Duration, formatDuration, intervalToDuration, interval } from 'date-fns'
import { cn } from '@/common/utils/css'

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

  return (
    <>
      <Pressable
        // why does active modifier just not work sometimes, fucking nativewind...
        className='flex flex-row grow gap-2 bg-bgTertiary p-2 px-4 rounded-lg justify-between'
        style={({ pressed }) => ({
          ...(isLast && name.length < 20 && { width: '50%', flexGrow: 0 }),
          ...(pressed && { backgroundColor: colors.bgSecondary }),
        })}
        onPress={onTrackerPress}
        cssInterop={false}
      >
        <Text className='text-fgSecondary'>{name}:</Text>
        <TrackerItemValue {...typeSpecificData} />
      </Pressable>
      <SheetModal ref={bottomSheetModalRef}>
        {typeSpecificData.type === 'stat' ? (
          <StatTrackerSheet id={id} />
        ) : (
          <DateTrackerSheet id={id} name={name} renderData={renderData} {...typeSpecificData} />
        )}
      </SheetModal>
    </>
  )
}

export function TrackerItemValue({
  longDuration,
  className,
  ...typeSpecificData
}: { longDuration?: boolean; className?: string } & (
  | Omit<StatTracker, 'id' | 'name' | 'renderData'>
  | Omit<DateTracker, 'id' | 'name' | 'renderData'>
)) {
  const formatDateTrackerDuration = longDuration
    ? (duration: Duration) =>
        formatDuration(duration, {
          format: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
        })
    : formatDurationShort

  const [formattedDuration, setFormattedDuration] = useState(
    typeSpecificData.type === 'date'
      ? formatDateTrackerDuration(
          intervalToDuration(interval(new Date(), new Date(typeSpecificData.date)))
        )
      : ''
  )
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeSpecificData.type !== 'date') return

    intervalRef.current = setInterval(
      () =>
        setFormattedDuration(
          formatDateTrackerDuration(
            intervalToDuration(interval(new Date(), new Date(typeSpecificData.date)))
          )
        ),
      1000
    )

    return () => {
      intervalRef.current && clearInterval(intervalRef.current)
    }
    // it doesn't see the dependency because of type assertion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(typeSpecificData as DateTracker).date, typeSpecificData.type])

  const shownValue =
    typeSpecificData.type === 'date'
      ? formattedDuration
      : `${typeSpecificData.prefix ?? ''}${typeSpecificData.value ?? ''}${typeSpecificData.suffix ?? ''}`

  return <Text className={cn(`text-fg font-bold`, className)}>{shownValue}</Text>
}
