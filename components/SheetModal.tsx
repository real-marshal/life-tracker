import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { colors } from '@/common/theme'
import { SheetBackdrop } from '@/components/SheetBackdrop'
import { FC, ReactNode, RefObject } from 'react'
import { useSheetBackHandler } from '@/hooks/useSheetBackHandler'

export function SheetModal<T = any>({
  children,
  ref,
}: {
  children: ReactNode | FC<{ data?: T }>
  ref: RefObject<BottomSheetModal | null>
}) {
  const onSheetChange = useSheetBackHandler(ref)

  return (
    <BottomSheetModal<T>
      ref={ref}
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
      {children}
    </BottomSheetModal>
  )
}
