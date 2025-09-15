import { Modal, RestModalProps } from '@/components/Modal'
import { Text, View, Pressable, ScrollView } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { Checkbox } from 'expo-checkbox'
import { getLtGoals, linkLtGoal, unlinkLtGoal } from '@/models/goal'
import { cn } from '@/common/utils/css'

export function LinkLtGoalsModal({
  modalProps,
  hideModal,
  relatedLtGoalIds,
  goalId,
}: {
  modalProps: RestModalProps
  hideModal: () => void
  relatedLtGoalIds: number[]
  goalId: number
}) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: ltGoals, error: ltGoalsError } = useQuery({
    queryKey: ['goals', 'longterm'],
    queryFn: () => getLtGoals(db),
  })

  const { mutate: changeLinkingMutator, error: changeLinkingError } = useMutation({
    mutationFn: ({ link, ltGoalId }: { link: boolean; ltGoalId: number }) =>
      link ? linkLtGoal(db, ltGoalId, goalId) : unlinkLtGoal(db, ltGoalId, goalId),
    onSuccess: (_, { ltGoalId }) => {
      queryClient.invalidateQueries({ queryKey: ['goals', goalId] })
      queryClient.invalidateQueries({ queryKey: ['goals', ltGoalId] })
    },
  })

  useErrorToasts(
    { title: 'Error loading long-term goals', errorData: ltGoalsError },
    { title: 'Error changing link', errorData: changeLinkingError }
  )

  return (
    <Modal {...modalProps} containerClassName='justify-start px-4'>
      <View className='flex flex-col gap-6'>
        <View className='flex flex-row gap-6 items-center justify-between px-5'>
          <Text className='text-accent text-2xl font-bold'>Link long-term goals</Text>
          <Pressable onPress={hideModal}>
            {({ pressed }) => (
              <Feather name='x' size={24} color={pressed ? colors.fgSecondary : colors.fg} />
            )}
          </Pressable>
        </View>
        <ScrollView className='max-h-[100%] grow-0 px-5 pb-12' contentContainerClassName='gap-4'>
          {ltGoals?.map(({ id, name }) => {
            const value = relatedLtGoalIds.includes(id)

            return (
              <View key={id} className='flex flex-row gap-3 items-center'>
                <Checkbox
                  value={value}
                  onValueChange={(value) => changeLinkingMutator({ link: value, ltGoalId: id })}
                  color={colors.bgTertiary}
                  className='bg-bgTertiary'
                  style={{ borderRadius: 6 }}
                  hitSlop={4}
                />
                <Pressable onPress={() => changeLinkingMutator({ link: !value, ltGoalId: id })}>
                  <Text
                    className={cn('bg-bgTertiary text-fgSecondary py-2 px-3 rounded-md', {
                      'text-ltGoal bg-bg': value,
                    })}
                  >
                    {name}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}
