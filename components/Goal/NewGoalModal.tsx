import { Modal, RestModalProps } from '@/components/Modal'
import { Dimensions, Keyboard, Text, TextInput, View } from 'react-native'
import { colors } from '@/common/theme'
import { AppButton } from '@/components/AppButton'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addGoal, AddGoalParam } from '@/models/goal'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'

export function NewGoalModal({
  modalProps,
  hideModal,
}: {
  modalProps: RestModalProps
  hideModal: () => void
}) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { mutate: addGoalMutator, error: addingError } = useMutation({
    mutationFn: (param: AddGoalParam) => addGoal(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', 'active'] }),
  })

  useErrorToasts({ title: 'Error adding goal', errorData: addingError })

  const [text, setText] = useState<string>('')
  const [why, setWhy] = useState<string>('')

  return (
    <Modal
      {...modalProps}
      containerClassName='justify-start px-5 pb-5 pt-4'
      onPress={() => {
        Keyboard.dismiss()
        modalProps.onCancel()
        setText('')
        setWhy('')
      }}
      onCancel={() => {
        modalProps.onCancel()
        setText('')
        setWhy('')
      }}
    >
      <View className='flex flex-col gap-5' style={{ width: Dimensions.get('window').width * 0.8 }}>
        <View className='flex flex-col gap-2'>
          <Text className='text-accent text-xl font-light'>New goal</Text>
          <TextInput
            className='text-fg text-xl p-1 py-2 border-b-2 border-accent rounded-md'
            autoFocus
            multiline
            value={text}
            onChangeText={setText}
          />
        </View>
        <View className='flex flex-col gap-2'>
          <Text className='text-fgSecondary'>Why:</Text>
          <TextInput
            className='text-fg bg-bgTertiary rounded-md min-h-16 p-3'
            multiline
            textAlignVertical='top'
            value={why}
            onChangeText={setWhy}
          />
        </View>

        <AppButton
          text='Add'
          onPress={() => {
            addGoalMutator({ text, why: !why ? null : why })

            setText('')
            setWhy('')
            hideModal()
          }}
          color={colors.positive}
          activeColor={colors.positiveActive}
        />
      </View>
    </Modal>
  )
}
