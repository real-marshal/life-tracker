import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addStatValue,
  AddStatValueParam,
  getStatTracker,
  updateStatValue,
  UpdateStatValueParam,
} from '@/models/tracker'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { useSQLiteContext } from 'expo-sqlite'
import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import { showErrorToast } from '@/common/utils/toast'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { isToday } from 'date-fns'
import { makeDateTz } from '@/common/utils/date'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { LineChart } from '@/components/LineChart/LineChart'
import { Popover, usePopover } from '@/components/Popover'
import { ContextMenuItem, ContextMenuSection } from '@/components/ContextMenu'
import { Modal, useModal } from '@/components/Modal'

export function TrackerSheet({ id }: { id: number }) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: statTracker, error: statTrackerError } = useQuery({
    queryKey: ['trackers', id],
    queryFn: () => getStatTracker(db, id),
  })

  const { mutate: addStatValueMutator, error: addingError } = useMutation({
    mutationFn: (param: AddStatValueParam) => addStatValue(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })
  const { mutate: updateStatValueMutator, error: updatingError } = useMutation({
    mutationFn: (param: UpdateStatValueParam) => updateStatValue(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })

  useErrorToasts(
    { title: 'Error loading a stat tracker', errorData: statTrackerError },
    { title: 'Error adding a stat value', errorData: addingError },
    { title: 'Error updating a stat value', errorData: updatingError }
  )

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = usePopover()

  const latestStatValue = statTracker?.values.at(-1)

  const isTodayTracked = latestStatValue?.date
    ? isToday(makeDateTz(latestStatValue.date).date)
    : false

  return (
    <BottomSheetView className='pb-safe-offset-4 px-4'>
      <Pressable
        onPress={() => {
          Keyboard.dismiss()
          hidePopover()
        }}
        className='flex flex-col gap-4'
      >
        <View className='flex flex-row justify-center items-center relative'>
          <Text className='text-accent font-bold text-center text-lg'>{statTracker?.name}</Text>
          <Pressable onPress={() => showPopover()} className='absolute right-4 top-[2]' hitSlop={4}>
            {({ pressed }) => (
              <Feather
                name='more-horizontal'
                size={24}
                color={pressed || isPopoverShown ? colors.accentActive : colors.accent}
              />
            )}
          </Pressable>
        </View>
        <LineChart data={statTracker?.values ?? []} x='date' y='value' />
        <View className='flex flex-col gap-4 items-center my-4'>
          <View className='flex flex-row gap-4'>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-1</Text>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-10</Text>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-100</Text>
            <Pressable
              onPress={() =>
                isTodayTracked &&
                updateStatValueMutator({
                  id: latestStatValue!.id,
                  value: latestStatValue!.value - 1000,
                })
              }
              className='bg-bgTertiary px-6 py-3 rounded-lg active:bg-bgSecondary'
            >
              <Text className='text-fg'>-1000</Text>
            </Pressable>
          </View>
          <View className='flex flex-col gap-2'>
            <Pressable onPress={() => null}>
              <View className='flex flex-row gap-2 px-4 py-2 bg-bgTertiary rounded-lg'>
                <View className='flex flex-row gap-1 items-center border-b-2 border-accent px-2'>
                  {statTracker?.prefix && (
                    <Text className='text-accent font-bold text-xl'>{statTracker.prefix}</Text>
                  )}
                  <TrackerValueInput
                    value={isTodayTracked ? latestStatValue?.value : undefined}
                    isAdding={!isTodayTracked}
                    trackerId={statTracker?.id}
                    statValueId={latestStatValue?.id}
                    onAddStatValue={addStatValueMutator}
                    onUpdateStatValue={updateStatValueMutator}
                  />
                  {statTracker?.suffix && (
                    <Text className='text-accent font-bold text-xl'>{statTracker.suffix}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          </View>
          <View className='flex flex-row gap-4'>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+1</Text>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+10</Text>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+100</Text>
            <Pressable
              onPress={() =>
                isTodayTracked &&
                updateStatValueMutator({
                  id: latestStatValue!.id,
                  value: latestStatValue!.value + 1000,
                })
              }
              className='bg-bgTertiary px-6 py-3 rounded-lg active:bg-bgSecondary'
            >
              <Text className='text-fg'>+1000</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
      <Popover isOpen={isPopoverShown} className='top-10 right-6' animatedStyle={animatedStyle}>
        <ContextMenuSection label='Tracker' first />
        <ContextMenuItem label='Change linked goals' iconName='link-2' first />
        <ContextMenuItem label='Edit historical data' iconName='edit-3' />
        <ContextMenuItem label='Delete tracker' iconName='trash' color={colors.negative} />
      </Popover>
    </BottomSheetView>
  )
}

function TrackerValueInput({
  value: passedValue,
  isAdding,
  trackerId,
  statValueId,
  onAddStatValue,
  onUpdateStatValue,
}: {
  value: number | undefined
  isAdding: boolean
  trackerId: number | undefined
  statValueId: number | undefined
  onAddStatValue: (param: AddStatValueParam) => void
  onUpdateStatValue: (param: UpdateStatValueParam) => void
}) {
  const [value, setValue] = useState(passedValue?.toString() ?? '')

  useEffect(() => {
    passedValue && setValue(passedValue.toString())
  }, [passedValue])

  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>({
    start: 0,
    end: 0,
  })

  // passing placeholder directly causes it to first appear with large font size, then decrease its size
  // using state fixes this forcing rerender at the correct time
  const [placeholder, setPlaceholder] = useState<string | undefined>(undefined)

  useEffect(() => {
    setPlaceholder(value ? undefined : isAdding ? 'Add new value...' : 'Modify value...')
  }, [isAdding, value])

  const isSubmitted = useRef(false)

  const { showModal, hideModal, ...modalProps } = useModal(() =>
    setValue(isAdding ? '' : passedValue!.toString())
  )

  return (
    <>
      <BottomSheetTextInput
        inputMode='numeric'
        value={value}
        onChangeText={(text: string) => {
          setValue(text)
          setSelection(undefined)
        }}
        className={`text-accent ${value ? 'text-xl font-bold' : 'text-sm font-regular'}`}
        placeholder={placeholder}
        selection={selection}
        textAlign='center'
        onFocus={() => {
          isSubmitted.current = false
          setSelection({ start: 0, end: value.length })
        }}
        onBlur={() => {
          value && Number.parseFloat(value) !== passedValue && showModal()
        }}
        onSubmitEditing={() => (isSubmitted.current = true)}
      />
      <Modal {...modalProps}>
        <Text className='text-fg self-center text-xl font-bold'>
          {isAdding ? 'Save new value?' : 'Update the value?'}
        </Text>
        <View className='flex flex-row gap-8'>
          {/* This is a funny one - if animationType is set to none and I add both paddings
                to view or text, the red/green button flickers at the top left corner of the screen when the keyboard
                is getting dismissed and the modal shows up! The only way to prevent this that I found
                is to just put one padding on the view and another on the text lol */}
          <Pressable
            className='bg-negative px-6 rounded-lg active:bg-negativeActive'
            onPress={modalProps.onCancel}
          >
            <Text className='text-bg font-medium py-3'>Cancel</Text>
          </Pressable>
          <Pressable
            className='bg-positive rounded-lg px-6 active:bg-positiveActive'
            onPress={() => {
              hideModal()

              const numValue = Number.parseFloat(value)

              if (Number.isNaN(numValue)) {
                showErrorToast('Bad input', 'Only numbers are allowed')

                return
              }

              if (isAdding) {
                if (!trackerId) return

                onAddStatValue({ trackerId, value: numValue })
              } else {
                if (!statValueId) return

                onUpdateStatValue({ id: statValueId, value: numValue })
              }
            }}
          >
            <Text className='text-bg font-medium py-3'>Save</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  )
}
