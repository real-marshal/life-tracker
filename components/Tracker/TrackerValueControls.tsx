import { AddStatValueParam, DetailedStatTracker, UpdateStatValueParam } from '@/models/tracker'
import { Modal, useModal } from '@/components/Modal'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { colors } from '@/common/theme'
import { makeDateTz } from '@/common/utils/date'
import { isToday } from 'date-fns'
import debounce from 'debounce'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { showErrorToast } from '@/common/utils/toast'
import { ConfirmModal } from '@/components/ConfirmModal'

export function TrackerValueControls({
  statTracker,
  addStatValue,
  updateStatValue,
}: {
  statTracker?: DetailedStatTracker
  addStatValue: (param: AddStatValueParam) => void
  updateStatValue: (param: UpdateStatValueParam) => void
}) {
  const latestStatValue = statTracker?.values.at(-1)

  const isTodayTracked = latestStatValue?.date
    ? isToday(makeDateTz(latestStatValue.date).date)
    : false

  const [value, setValue] = useState(latestStatValue?.value)

  useEffect(() => {
    setValue(latestStatValue?.value)
  }, [isTodayTracked, latestStatValue?.value])

  const debouncedUpdateStatValue = useMemo(() => debounce(updateStatValue, 500), [updateStatValue])

  const onButtonPress = (change: number) => () => {
    if (isTodayTracked) {
      const newValue = value! + change
      setValue(newValue)

      debouncedUpdateStatValue({
        id: latestStatValue!.id,
        value: newValue!,
      })
    } else if (value) {
      setAddChange(change)
      showModal()
    } else {
      showErrorToast('Add a new value first')
    }
  }

  const [addChange, setAddChange] = useState(0)

  const { showModal, hideModal, ...modalProps } = useModal()

  return (
    <View className='flex flex-col gap-4 items-center my-4'>
      <View className='flex flex-row gap-4'>
        {[-1, -10, -100, -1000].map((change) => (
          <TrackerValueButton key={change} change={change} onButtonPress={onButtonPress(change)} />
        ))}
      </View>
      <View className='flex flex-col gap-2'>
        <View className='flex flex-row gap-2 px-4 py-2 bg-bgTertiary rounded-lg'>
          <View className='flex flex-row gap-1 items-center border-b-2 border-accent px-2'>
            {statTracker?.prefix && (
              <Text className='text-accent font-bold text-xl'>{statTracker.prefix}</Text>
            )}
            <TrackerValueInput
              value={value}
              isAdding={!isTodayTracked}
              trackerId={statTracker?.id}
              statValueId={latestStatValue?.id}
              onAddStatValue={addStatValue}
              onUpdateStatValue={updateStatValue}
            />
            {statTracker?.suffix && (
              <Text className='text-accent font-bold text-xl'>{statTracker.suffix}</Text>
            )}
          </View>
        </View>
      </View>
      <View className='flex flex-row gap-4'>
        {[1, 10, 100, 1000].map((change) => (
          <TrackerValueButton key={change} change={change} onButtonPress={onButtonPress(change)} />
        ))}
      </View>
      <ConfirmModal
        text={`The value ${value! + addChange} (${value} ${addChange > 0 ? '+' : '-'} ${Math.abs(addChange)}) will be added?`}
        hideModal={hideModal}
        modalProps={modalProps}
        onConfirm={() => {
          addStatValue({ trackerId: statTracker!.id, value: value! + addChange })
        }}
      />
    </View>
  )
}

function TrackerValueButton({
  change,
  onButtonPress,
}: {
  change: number
  onButtonPress: () => void
}) {
  return (
    <Pressable
      onPress={onButtonPress}
      className='bg-bgTertiary px-6 py-3 rounded-lg active:bg-bgSecondary'
    >
      {({ pressed }) => (
        <Text style={{ color: pressed ? colors.accent : colors.fg }}>
          {change > 0 ? '+' : ''}
          {change}
        </Text>
      )}
    </Pressable>
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
    setValue(passedValue?.toString() ?? '')
  }, [passedValue])

  // selectTextOnFocus in addition selects first char on user input...
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

  const { showModal, hideModal, ...modalProps } = useModal(() =>
    setValue(passedValue?.toString() ?? '')
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
          setSelection({ start: 0, end: value.length })
        }}
        onBlur={() => {
          value && Number.parseFloat(value) !== passedValue && showModal()
        }}
      />
      <ConfirmModal
        text={isAdding ? 'Add new value?' : 'Update the value?'}
        hideModal={hideModal}
        modalProps={modalProps}
        onConfirm={() => {
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
      />
    </>
  )
}
