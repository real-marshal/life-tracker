import { Pressable, Text, View } from 'react-native'
import { Tracker } from '@/models/tracker'
import { formatDurationShort } from '@/common/utils/date'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useCallback, useRef } from 'react'
import { colors } from '@/common/theme'
import { SheetBackdrop } from '@/components/SheetBackdrop'
import { TrackerSheet } from '@/components/Tracker/TrackerSheet'
import { useSheetBackHandler } from '@/hooks/useSheetBackHandler'

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

  const onSheetChange = useSheetBackHandler(bottomSheetModalRef)

  const shownValue =
    typeSpecificData.type === 'date'
      ? formatDurationShort(typeSpecificData.duration)
      : `${typeSpecificData.prefix ?? ''}${typeSpecificData.value}${typeSpecificData.suffix ?? ''}`

  return (
    <>
      <Pressable
        // why does active modifier just not work sometimes, fucking nativewind...
        className='flex flex-row grow gap-2 bg-bgTertiary p-2 px-4 rounded-lg justify-between'
        style={({ pressed }) => ({
          ...(isLast && { width: '50%', flexGrow: 0 }),
          ...(pressed && { backgroundColor: colors.bgSecondary }),
        })}
        onPress={onTrackerPress}
        cssInterop={false}
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
        keyboardBlurBehavior='restore'
        enableBlurKeyboardOnGesture
        backdropComponent={SheetBackdrop}
        onChange={onSheetChange}
      >
        <TrackerSheet id={id} />
      </BottomSheetModal>
    </>
  )
}
