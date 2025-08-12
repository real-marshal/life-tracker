import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addStatValue,
  AddStatValueParam,
  deleteTracker,
  getStatTracker,
  updateStatValue,
  UpdateStatValueParam,
} from '@/models/tracker'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { useSQLiteContext } from 'expo-sqlite'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { Keyboard, Pressable, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { LineChart } from '@/components/LineChart/LineChart'
import { Popover } from '@/components/Popover'
import { ContextMenuItem, ContextMenuSection } from '@/components/ContextMenu'
import { useModal } from '@/components/Modal'
import { TrackerValueControls } from '@/components/Tracker/TrackerValueControls'
import { HistoricalData } from './HistoricalData'
import { LinkedGoals } from '@/components/Tracker/LinkedGoals'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ConfirmModal } from '@/components/ConfirmModal'

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
  const { mutate: deleteTrackerMutator, error: deletionError } = useMutation({
    mutationFn: (id: number) => deleteTracker(db, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })

  useErrorToasts(
    { title: 'Error loading a stat tracker', errorData: statTrackerError },
    { title: 'Error adding a stat value', errorData: addingError },
    { title: 'Error updating a stat value', errorData: updatingError },
    { title: 'Error deleting a tracker', errorData: deletionError }
  )

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = useContextMenu()

  const {
    showModal: showLinkedGoalsModal,
    hideModal: hideLinkedGoalsModal,
    ...linkedGoalsModalProps
  } = useModal()
  const {
    showModal: showHistoricalDataModal,
    hideModal: hideHistoricalDataModal,
    ...historicalDataModalProps
  } = useModal()
  const {
    showModal: showDeleteTrackerModal,
    hideModal: hideDeleteTrackerModal,
    ...deleteTrackerModalProps
  } = useModal()

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
        <TrackerValueControls
          statTracker={statTracker}
          addStatValue={addStatValueMutator}
          updateStatValue={updateStatValueMutator}
        />
      </Pressable>
      <Popover isOpen={isPopoverShown} className='top-10 right-6' animatedStyle={animatedStyle}>
        <ContextMenuSection label='Tracker' first />
        <ContextMenuItem
          label='Remove linked goals'
          iconName='link-2'
          onPress={() => {
            showLinkedGoalsModal()
            hidePopover()
          }}
        />
        <ContextMenuItem
          label='Edit historical data'
          iconName='edit-3'
          onPress={() => {
            showHistoricalDataModal()
            hidePopover()
          }}
        />
        <ContextMenuItem
          label='Delete tracker'
          iconName='trash'
          color={colors.negative}
          last
          onPress={showDeleteTrackerModal}
        />
      </Popover>
      {statTracker && (
        <LinkedGoals
          trackerId={statTracker.id}
          modalProps={linkedGoalsModalProps}
          hideModal={hideLinkedGoalsModal}
        />
      )}
      {statTracker && (
        <HistoricalData
          statTracker={statTracker}
          modalProps={historicalDataModalProps}
          hideModal={hideHistoricalDataModal}
          updateStatValue={updateStatValueMutator}
        />
      )}
      <ConfirmModal
        text='Are you sure you want to delete this tracker and all its values?'
        hideModal={hideDeleteTrackerModal}
        modalProps={deleteTrackerModalProps}
        onConfirm={() => {
          deleteTrackerMutator(id)
        }}
        deletion
        containerClassName='max-w-[80%]'
      />
    </BottomSheetView>
  )
}
