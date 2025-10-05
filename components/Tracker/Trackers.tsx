import { Pressable, Text } from 'react-native'
import { DateTracker, StatTracker, Tracker, updateTrackerIndices } from '@/models/tracker'
import { formatDurationShort } from '@/common/utils/date'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { colors } from '@/common/theme'
import { StatTrackerSheet } from '@/components/Tracker/StatTrackerSheet'
import { SheetModal } from '@/components/SheetModal'
import { DateTrackerSheet } from '@/components/Tracker/DateTrackerSheet'
import { Duration, formatDuration, intervalToDuration, interval } from 'date-fns'
import { cn } from '@/common/utils/css'
import { useFocusEffect } from 'expo-router'
import Sortable from 'react-native-sortables'
import { performContextMenuHaptics } from '@/common/utils/haptics'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'

export function Trackers({ trackers }: { trackers: Tracker[] }) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { mutate: updateIndicesMutator, error: updatingIndicesError } = useMutation({
    mutationFn: (param: { id: number; index: number }[]) => updateTrackerIndices(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })

  useErrorToasts({ title: 'Error updating indices', errorData: updatingIndicesError })

  return (
    <Sortable.Flex
      overDrag='none'
      activeItemScale={1}
      gap={8}
      onDragStart={performContextMenuHaptics}
      onDragEnd={({ fromIndex, toIndex }) => {
        if (!trackers.length) return

        const updates = [{ id: trackers[fromIndex].id, index: toIndex }]

        if (fromIndex > toIndex) {
          for (let i = toIndex; i < fromIndex; i++) {
            updates.push({ id: trackers[i].id, index: i + 1 })
          }
        } else {
          for (let i = fromIndex + 1; i <= toIndex; i++) {
            updates.push({ id: trackers[i].id, index: i - 1 })
          }
        }

        updateIndicesMutator(updates)
      }}
    >
      {trackers?.map((tracker) => (
        <TrackerItem {...tracker} key={tracker.id} />
      ))}
    </Sortable.Flex>
  )
}

export function TrackerItem({
  id,
  name,
  renderData,
  onPress,
  ...typeSpecificData
}: Tracker & { onPress?: () => void }) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const isSheetModalTemporarilyHiddenRef = useRef(false)

  const onTrackerPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const temporarilyHideModalRef = useCallback(() => {
    bottomSheetModalRef.current?.close()
    isSheetModalTemporarilyHiddenRef.current = true
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (isSheetModalTemporarilyHiddenRef.current) {
        bottomSheetModalRef.current?.present()
        isSheetModalTemporarilyHiddenRef.current = false
      }
    }, [])
  )

  return (
    <>
      <Pressable
        // why does active modifier just not work sometimes, fucking nativewind...
        className='flex flex-row gap-2 bg-bgTertiary p-2 px-4 rounded-lg justify-between'
        style={({ pressed }) => ({
          ...(pressed && { backgroundColor: colors.bgSecondary }),
        })}
        onPress={onPress ? onPress : onTrackerPress}
        cssInterop={false}
      >
        <Text className='text-fgSecondary'>{name}:</Text>
        <TrackerItemValue {...typeSpecificData} />
      </Pressable>
      {!onPress && (
        <SheetModal ref={bottomSheetModalRef}>
          {typeSpecificData.type === 'stat' ? (
            <StatTrackerSheet id={id} hideSheet={temporarilyHideModalRef} />
          ) : (
            <DateTrackerSheet
              id={id}
              name={name}
              renderData={renderData}
              hideSheet={temporarilyHideModalRef}
              {...typeSpecificData}
            />
          )}
        </SheetModal>
      )}
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

  const computeDateTrackerValue = () => {
    if (typeSpecificData.type !== 'date') return ''

    const targetDate = new Date(typeSpecificData.date)
    const now = new Date()
    const hasPassed = now >= targetDate

    const duration = intervalToDuration(
      hasPassed ? interval(targetDate, now) : interval(now, targetDate)
    )

    if (hasPassed) {
      return longDuration ? `Happened ${formatDateTrackerDuration(duration)} ago` : '✓'
    }

    return formatDateTrackerDuration(duration)
  }

  const [formattedDuration, setFormattedDuration] = useState(
    typeSpecificData.type === 'date' ? computeDateTrackerValue() : ''
  )
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeSpecificData.type !== 'date') return

    intervalRef.current = setInterval(() => setFormattedDuration(computeDateTrackerValue()), 1000)

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
