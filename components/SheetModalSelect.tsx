import { SheetModal } from '@/components/SheetModal'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Text } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import { RefObject } from 'react'
import { capitalize } from 'lodash'
import { colors } from '@/common/theme'

export function SheetModalSelect<T extends string>({
  ref,
  title,
  options,
  onSelect,
  value: selectedValue,
}: {
  ref: RefObject<BottomSheetModal | null>
  title: string
  options: { label?: string; value: T }[]
  onSelect: (value: T) => void
  value?: T
}) {
  return (
    <SheetModal ref={ref}>
      <BottomSheetView>
        <Text className='text-fgSecondary px-5 py-2 text-lg font-medium'>{title}</Text>
        {options.map(({ label, value }, ind) => (
          <Pressable
            key={ind}
            onPress={() => {
              ref.current?.dismiss()
              onSelect(value)
            }}
            className='p-5'
          >
            <Text
              className='p-5'
              style={{ color: value === selectedValue ? colors.accent : colors.fg }}
            >
              {label ?? capitalize(value)}
            </Text>
          </Pressable>
        ))}
      </BottomSheetView>
    </SheetModal>
  )
}
