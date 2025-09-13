import { SheetModal } from '@/components/SheetModal'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Text, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import { RefObject } from 'react'
import { capitalize } from 'lodash'
import { colors } from '@/common/theme'
import { cn } from '@/common/utils/css'

export function SheetModalSelect<T extends string>({
  ref,
  title,
  options,
  onSelect,
  value: selectedValue,
}: {
  ref: RefObject<BottomSheetModal | null>
  title: string
  options: { value: T; label?: string; description?: string }[]
  onSelect: (value: T) => void
  value?: T
}) {
  return (
    <SheetModal ref={ref}>
      <BottomSheetView>
        <Text className='text-accent px-6 py-2 text-lg font-medium text-center'>{title}</Text>
        <View className='flex flex-col gap-4 px-6 py-5'>
          {options.map(({ value, label, description }, ind) => (
            <Pressable
              key={ind}
              onPress={() => {
                ref.current?.dismiss()
                onSelect(value)
              }}
              hitSlop={4}
            >
              {({ pressed }) => (
                <View
                  className={cn('items-center py-2', {
                    'bg-bgTertiary rounded-md': pressed,
                  })}
                >
                  <Text style={{ color: value === selectedValue ? colors.accent : colors.fg }}>
                    {label ?? capitalize(value)}
                  </Text>
                  {description && (
                    <Text className='text-fgSecondary text-sm pt-2'>{description}</Text>
                  )}
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </SheetModal>
  )
}
