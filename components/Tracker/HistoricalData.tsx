import { deleteStatValue, DetailedStatTracker, UpdateStatValueParam } from '@/models/tracker'
import { Modal, RestModalProps } from '@/components/Modal'
import { useSQLiteContext } from 'expo-sqlite'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { RefObject, useEffect, useRef, useState } from 'react'
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { ScrollView } from 'react-native-gesture-handler'
import { format } from 'date-fns'
import { makeDateTz } from '@/common/utils/date'
import { Popover, usePopover } from '@/components/Popover'
import { ContextMenuItem } from '@/components/ContextMenu'

export function HistoricalData({
  statTracker,
  modalProps,
  hideModal,
  updateStatValue,
}: {
  statTracker: DetailedStatTracker
  modalProps: RestModalProps
  hideModal: () => void
  updateStatValue: (param: UpdateStatValueParam) => void
}) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { mutate: deleteStatValueMutator, error: deletingError } = useMutation({
    mutationFn: (id: number) => deleteStatValue(db, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })

  useErrorToasts({ title: 'Error deleting a stat tracker', errorData: deletingError })

  const onModalPress = useRef<(() => void)[]>([() => null])

  return (
    <Modal
      {...modalProps}
      containerClassName='justify-start px-4'
      onPress={() => {
        Keyboard.dismiss()
        onModalPress.current.forEach((f) => f())
      }}
    >
      <View className='flex flex-col gap-6'>
        <View className='flex flex-row gap-6 items-center justify-between px-5'>
          <Text className='text-fg text-2xl font-bold'>Historical data</Text>
          <Pressable onPress={hideModal}>
            {({ pressed }) => (
              <Feather name='x' size={24} color={pressed ? colors.fgSecondary : colors.fg} />
            )}
          </Pressable>
        </View>
        <ScrollView className='max-h-[100%] grow-0 px-5 pb-12'>
          <View className='flex flex-col gap-2'>
            {statTracker.values?.toReversed().map((trackerValue) => (
              <View
                className='flex flex-row gap-5 justify-between items-center px-4 rounded-lg bg-bgTertiary'
                key={trackerValue.id}
              >
                <Text className='text-fgSecondary grow'>
                  {format(makeDateTz(trackerValue.date).date, 'LLL d, y')}
                </Text>
                <View className='flex flex-row items-center gap-5'>
                  <HistoricalDataValueEdit
                    trackerValue={trackerValue}
                    updateStatValue={updateStatValue}
                    deleteStatValue={deleteStatValueMutator}
                    onModalPressRef={onModalPress}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

function HistoricalDataValueEdit({
  trackerValue,
  updateStatValue,
  deleteStatValue,
  onModalPressRef,
}: {
  trackerValue: DetailedStatTracker['values'][0]
  updateStatValue: (param: UpdateStatValueParam) => void
  deleteStatValue: (id: number) => void
  onModalPressRef: RefObject<(() => void)[]>
}) {
  const textInputRef = useRef<TextInput>(null)

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = usePopover()

  useEffect(() => {
    onModalPressRef.current.push(hidePopover)
  }, [hidePopover, onModalPressRef])

  return (
    <>
      <View className='flex flex-row items-center gap-1'>
        <NumberInput
          className='text-fg font-medium'
          value={trackerValue.value}
          ref={textInputRef}
          onBlur={({ value, setValue }) =>
            value &&
            !Number.isNaN(Number.parseFloat(value)) &&
            Number.parseFloat(value) !== trackerValue.value
              ? updateStatValue({
                  id: trackerValue.id,
                  value: Number.parseFloat(value),
                })
              : setValue(trackerValue.value.toString())
          }
        />
        <Pressable onPress={() => textInputRef.current?.focus()} hitSlop={4}>
          {({ pressed }) => (
            <Feather name='edit-3' size={16} color={pressed ? colors.fgSecondary : colors.fg} />
          )}
        </Pressable>
      </View>
      <Pressable onPress={showPopover} hitSlop={4}>
        {({ pressed }) => (
          <Feather
            name='trash'
            size={16}
            color={pressed || isPopoverShown ? colors.negativeActive : colors.negative}
          />
        )}
      </Pressable>
      <Popover
        isOpen={isPopoverShown}
        className='top-10 -right-5 z-[9999999]'
        animatedStyle={animatedStyle}
      >
        <ContextMenuItem
          label='Delete this value?'
          iconName='trash'
          color={colors.negative}
          onPress={() => {
            hidePopover()
            deleteStatValue(trackerValue.id)
          }}
          last
          rnPressable
        />
      </Popover>
    </>
  )
}

function NumberInput({
  value: passedValue,
  onBlur,
  ref,
}: {
  value: number | undefined
  onBlur?: ({
    value,
    setValue,
  }: {
    value: string | undefined
    setValue: (v: string) => void
  }) => void
  className?: string
  ref?: RefObject<TextInput | null>
}) {
  const [value, setValue] = useState(passedValue?.toString() ?? '')

  useEffect(() => {
    passedValue && setValue(passedValue.toString())
  }, [passedValue])

  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>({
    start: 0,
    end: 0,
  })

  return (
    <TextInput
      className='text-fg font-medium'
      inputMode='numeric'
      value={value}
      onChangeText={(text: string) => {
        setValue(text)
        setSelection(undefined)
      }}
      selection={selection}
      textAlign='center'
      onFocus={() => {
        setSelection({ start: 0, end: value.length })
      }}
      onBlur={() => onBlur?.({ value, setValue })}
      ref={ref}
    />
  )
}
