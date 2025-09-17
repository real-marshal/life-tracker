import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DateTracker, deleteTracker } from '@/models/tracker'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { useSQLiteContext } from 'expo-sqlite'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { Keyboard, Pressable, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { Popover } from '@/components/Popover'
import { ContextMenuItem, ContextMenuSection } from '@/components/ContextMenu'
import { useModal } from '@/components/Modal'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ConfirmModal } from '@/components/ConfirmModal'
import { TrackerItemValue } from '@/components/Tracker/Trackers'
import { useRouter } from 'expo-router'
import { formatISO } from 'date-fns'

export function DateTrackerSheet({
  id,
  name,
  date,
  hideSheet,
}: DateTracker & { hideSheet?: () => void }) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutate: deleteTrackerMutator, error: deletionError } = useMutation({
    mutationFn: (id: number) => deleteTracker(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  useErrorToasts({ title: 'Error deleting a tracker', errorData: deletionError })

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = useContextMenu()

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
          <Text className='text-accent font-bold text-center text-lg'>{name}</Text>
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
        <View className='flex flex-col justify-center items-center py-16 gap-8'>
          <Feather name='clock' size={48} color={colors.accent} />
          <TrackerItemValue type='date' date={date} longDuration className='text-xl' />
        </View>
      </Pressable>
      <Popover isOpen={isPopoverShown} className='top-10 right-6' animatedStyle={animatedStyle}>
        <ContextMenuSection label='Modify' first />
        <ContextMenuItem
          label='Edit tracker'
          iconName='edit-3'
          onPress={() => {
            router.navigate({
              pathname: '/tracker/[id]/edit',
              params: { id, name, type: 'date', date: formatISO(date) },
            })
            setTimeout(() => {
              hidePopover()
              hideSheet?.()
            }, 200)
          }}
        />
        <ContextMenuItem
          label='Delete tracker'
          iconName='trash'
          color={colors.negative}
          onPress={showDeleteTrackerModal}
          last
        />
      </Popover>
      <ConfirmModal
        text='Are you sure you want to delete this tracker?'
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
