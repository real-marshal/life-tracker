import {
  deleteStatValue,
  DetailedStatTracker,
  getDetailedStatTracker,
  updateStatValue,
  UpdateStatValueParam,
} from '@/models/tracker'
import { useSQLiteContext } from 'expo-sqlite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { RefObject, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { format } from 'date-fns'
import { makeDateTz } from '@/common/utils/date'
import { ContextMenuItem } from '@/components/ContextMenu'
import { Modal, useModal } from '@/components/Modal'
import hairlineWidth = StyleSheet.hairlineWidth

export function HistoricalData({ trackerId }: { trackerId: number }) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: statTracker, error: statTrackerError } = useQuery({
    queryKey: ['trackers', 'detailed', trackerId],
    queryFn: () => getDetailedStatTracker(db, trackerId),
  })
  const { mutate: updateStatValueMutator, error: updatingError } = useMutation({
    mutationFn: (param: UpdateStatValueParam) => updateStatValue(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })
  const { mutate: deleteStatValueMutator, error: deletingError } = useMutation({
    mutationFn: (id: number) => deleteStatValue(db, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })

  useErrorToasts(
    { title: 'Error loading a stat tracker', errorData: statTrackerError },
    { title: 'Error updating a stat tracker', errorData: updatingError },
    { title: 'Error deleting a stat tracker', errorData: deletingError }
  )

  return (
    <View className='flex flex-col gap-6 max-h-[400]'>
      <FlatList
        className='px-5 grow-0'
        contentContainerClassName='flex flex-col gap-2 py-5'
        data={statTracker?.values?.toReversed()}
        renderItem={({ item: trackerValue }) => (
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
                updateStatValue={updateStatValueMutator}
                deleteStatValue={deleteStatValueMutator}
              />
            </View>
          </View>
        )}
      />
    </View>
  )
}

function HistoricalDataValueEdit({
  trackerValue,
  updateStatValue,
  deleteStatValue,
}: {
  trackerValue: DetailedStatTracker['values'][0]
  updateStatValue: (param: UpdateStatValueParam) => void
  deleteStatValue: (id: number) => void
}) {
  const textInputRef = useRef<TextInput>(null)

  const { showModal, hideModal, ...modalProps } = useModal()

  const [contextMenuPosition, setContextMenuPosition] = useState(0)

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
      <Pressable
        onPress={(e) => {
          setContextMenuPosition(e.nativeEvent.pageY - e.nativeEvent.locationY)
          showModal()
        }}
        hitSlop={4}
      >
        {({ pressed }) => (
          <Feather
            name='trash'
            size={16}
            color={pressed || modalProps.isModalShown ? colors.negativeActive : colors.negative}
          />
        )}
      </Pressable>
      <Modal
        {...modalProps}
        onPress={hideModal}
        containerClassName='absolute p-0 m-0 border-hairline border-bgTertiary'
        containerStyle={{
          top: contextMenuPosition,
          right: 30,
          borderColor: colors.bgTertiary,
          borderWidth: hairlineWidth,
        }}
        disableOverlay
      >
        <ContextMenuItem
          label='Delete this value?'
          iconName='trash'
          color={colors.negative}
          onPress={() => {
            hideModal()
            deleteStatValue(trackerValue.id)
          }}
          first
          last
          rnPressable
        />
      </Modal>
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
