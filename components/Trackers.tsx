import { Keyboard, Modal, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native'
import {
  addStatValue,
  AddStatValueParam,
  getStatTracker,
  Tracker,
  updateStatValue,
  UpdateStatValueParam,
} from '@/models/tracker'
import { formatDurationShort, makeDateTz } from '@/common/utils/date'
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { colors } from '@/common/theme'
import { LineChart } from '@/components/LineChart/LineChart'
import Feather from '@expo/vector-icons/Feather'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { isToday } from 'date-fns'
import { SheetBackdrop } from '@/components/SheetBackdrop'
import { showErrorToast } from '@/common/utils/toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
      >
        <TrackerSheet id={id} />
      </BottomSheetModal>
    </>
  )
}

function TrackerSheet({ id }: { id: number }) {
  const db = useSQLiteContext()
  const { data: statTracker, error: statTrackerError } = useQuery({
    queryKey: ['trackers', id],
    queryFn: () => getStatTracker(db, id),
  })

  useErrorToasts({ title: 'Error loading a stat tracker', errorData: statTrackerError })

  const isTodayTracked = statTracker?.values.at(-1)?.date
    ? isToday(makeDateTz(statTracker.values.at(-1)!.date).date)
    : false

  return (
    <BottomSheetView className='flex flex-col pb-safe-offset-4 px-4 gap-4'>
      <View className='flex flex-row justify-center items-center relative'>
        <Text className='text-accent font-bold text-center text-lg'>{statTracker?.name}</Text>
        <Feather
          name='more-horizontal'
          size={24}
          color={colors.accent}
          className='absolute right-0'
        />
      </View>
      <LineChart data={statTracker?.values ?? []} x='date' y='value' />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View className='flex flex-col gap-4 items-center my-4'>
          <View className='flex flex-row gap-4'>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-1</Text>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-10</Text>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-100</Text>
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>-1000</Text>
          </View>
          <View className='flex flex-col gap-2'>
            <Pressable onPress={() => null}>
              <View className='flex flex-row gap-2 px-4 py-2 bg-bgTertiary rounded-lg'>
                <View className='flex flex-row gap-1 items-center border-b-2 border-accent px-2'>
                  {statTracker?.prefix && (
                    <Text className='text-accent font-bold text-xl'>{statTracker.prefix}</Text>
                  )}
                  <TrackerValueInput
                    value={isTodayTracked ? statTracker?.values.at(-1)?.value : undefined}
                    isAdding={!isTodayTracked}
                    trackerId={statTracker?.id}
                    statValueId={statTracker?.values.at(-1)?.id}
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
            <Text className='text-fg bg-bgTertiary px-6 py-3 rounded-lg'>+1000</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </BottomSheetView>
  )
}

function TrackerValueInput({
  value: passedValue,
  isAdding,
  trackerId,
  statValueId,
}: {
  value: number | undefined
  isAdding: boolean
  trackerId: number | undefined
  statValueId: number | undefined
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

  const [isModalOpen, setIsModalOpen] = useState(false)

  const queryClient = useQueryClient()

  const { mutate: addStatValueMutator, error: addingError } = useMutation({
    mutationFn: (param: AddStatValueParam) => addStatValue(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })
  const { mutate: updateStatValueMutator, error: updatingError } = useMutation({
    mutationFn: (param: UpdateStatValueParam) => updateStatValue(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })

  useErrorToasts(
    { title: 'Error adding a stat value', errorData: addingError },
    { title: 'Error updating a stat value', errorData: updatingError }
  )

  const db = useSQLiteContext()

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
          // !isTodayTracked && !isSubmitted.current && setValue('')
          value && Number.parseFloat(value) !== passedValue && setIsModalOpen(true)
        }}
        onSubmitEditing={() => (isSubmitted.current = true)}
      />
      <SaveModal
        isOpen={isModalOpen}
        isAdding={isAdding}
        onCancel={() => {
          setIsModalOpen(false)
          setValue(isAdding ? '' : passedValue!.toString())
        }}
        onSave={() => {
          setIsModalOpen(false)

          const numValue = Number.parseFloat(value)

          if (Number.isNaN(numValue)) {
            showErrorToast('Bad input', 'Only numbers are allowed')

            return
          }

          if (isAdding) {
            if (!trackerId) return

            addStatValueMutator({ trackerId, value: numValue })
          } else {
            if (!statValueId) return

            updateStatValueMutator({ id: statValueId, value: numValue })
          }
        }}
      />
    </>
  )
}

function SaveModal({
  isOpen,
  isAdding,
  onCancel,
  onSave,
}: {
  isOpen: boolean
  isAdding: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <Modal transparent visible={isOpen} onRequestClose={onCancel} animationType='none'>
      <View className='flex flex-col items-center justify-center bg-[rgba(0,0,0,0.5)] flex-1'>
        <View className='flex flex-col items-center justify-center bg-bgSecondary px-8 pb-8 pt-7 rounded-lg border-hairline border-[#444] gap-6'>
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
              onPress={onCancel}
            >
              <Text className='text-bg font-medium py-3'>Cancel</Text>
            </Pressable>
            <Pressable
              className='bg-positive rounded-lg px-6 active:bg-positiveActive'
              onPress={onSave}
            >
              <Text className='text-bg font-medium py-3'>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
