import { Modal, RestModalProps } from '@/components/Modal'
import { Pressable, Text, View } from 'react-native'

export function ConfirmModal({
  text,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  hideModal,
  modalProps,
  onConfirm,
}: {
  text: string
  cancelText?: string
  confirmText?: string
  hideModal: () => void
  modalProps: RestModalProps
  onConfirm: () => void
}) {
  return (
    <Modal {...modalProps}>
      <Text className='text-fg self-center text-xl font-bold text-center'>{text}</Text>
      <View className='flex flex-row gap-8'>
        {/* This is a funny one - if animationType is set to none and I add both paddings
                to view or text, the red/green button flickers at the top left corner of the screen when the keyboard
                is getting dismissed and the modal shows up! The only way to prevent this that I found
                is to just put one padding on the view and another on the text lol */}
        <Pressable
          className='bg-negative px-6 rounded-lg active:bg-negativeActive'
          onPress={modalProps.onCancel}
        >
          <Text className='text-bg font-medium py-3'>{cancelText}</Text>
        </Pressable>
        <Pressable
          className='bg-positive rounded-lg px-6 active:bg-positiveActive'
          onPress={() => {
            hideModal()
            onConfirm()
          }}
        >
          <Text className='text-bg font-medium py-3'>{confirmText}</Text>
        </Pressable>
      </View>
    </Modal>
  )
}
