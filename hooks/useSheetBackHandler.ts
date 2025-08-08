import { RefObject, useCallback, useRef } from 'react'
import { BottomSheetModal, BottomSheetModalProps } from '@gorhom/bottom-sheet'
import { BackHandler, NativeEventSubscription } from 'react-native'

// allow sheet to dismiss on pressing back button on android
export const useSheetBackHandler = (sheetRef: RefObject<BottomSheetModal | null>) => {
  const backHandlerListenerRef = useRef<NativeEventSubscription | null>(null)

  return useCallback<NonNullable<BottomSheetModalProps['onChange']>>(
    (index) => {
      const isBottomSheetVisible = index >= 0

      if (isBottomSheetVisible && !backHandlerListenerRef.current) {
        backHandlerListenerRef.current = BackHandler.addEventListener('hardwareBackPress', () => {
          sheetRef.current?.dismiss()

          return true
        })
      } else if (!isBottomSheetVisible) {
        backHandlerListenerRef.current?.remove()

        backHandlerListenerRef.current = null
      }
    },
    [sheetRef, backHandlerListenerRef]
  )
}
