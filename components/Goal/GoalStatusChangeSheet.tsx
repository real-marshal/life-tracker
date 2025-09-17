import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { changeGoalStatus, ChangeGoalStatusParam, Goal, LtGoal } from '@/models/goal'
import { SheetModalData } from '@/app/goal/[id]'
import { RelatedGoals } from '@/components/Goal/RelatedGoals'
import { colors, getGoalColor } from '@/common/theme'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMetaStats } from '@/models/metastat'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { AppButton } from '@/components/AppButton'
import { useEffect, useState } from 'react'
import { metastatGains } from '@/components/Metastat/common'
import { GoalUpdate, GoalUpdateStatusChange } from '@/models/goalUpdate'

const actionDetailsMap: Record<
  SheetModalData['action'],
  {
    title: string
    color: string
    colorActive: string
    buttonText: string
    messageLabel: string
    newStatus: GoalUpdateStatusChange['statusChange']
    sentiment: GoalUpdate['sentiment']
  }
> = {
  abandon: {
    title: 'Abandon the goal',
    color: colors.negative,
    colorActive: colors.negativeActive,
    buttonText: 'Abandon',
    messageLabel: 'Closing message',
    newStatus: 'abandoned',
    sentiment: 'negative',
  },
  complete: {
    title: 'Complete the goal',
    color: colors.positive,
    colorActive: colors.positiveActive,
    buttonText: 'Complete',
    messageLabel: 'Closing message',
    newStatus: 'completed',
    sentiment: 'positive',
  },
  delay: {
    title: 'Delay the goal',
    color: colors.delayedGoal,
    colorActive: colors.delayedGoalActive,
    buttonText: 'Delay',
    messageLabel: 'Why',
    newStatus: 'delayed',
    sentiment: 'neutral',
  },
  reopen: {
    title: 'Reopen the goal',
    color: colors.positive,
    colorActive: colors.positiveActive,
    buttonText: 'Reopen',
    messageLabel: 'Why',
    newStatus: 'reopened',
    sentiment: 'positive',
  },
}

const metastatGainValues = [
  { label: 'No', value: 0 },
  { label: 'A bit', value: metastatGains.small },
  { label: 'Considerably', value: metastatGains.big },
]

export function GoalStatusChangeSheet({
  id,
  action,
  goal,
  isLongTerm,
  onComplete,
}: {
  id: number
  action?: SheetModalData['action']
  goal?: Goal | LtGoal
  isLongTerm: boolean
  onComplete: () => void
}) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: metastats, error: metaStatsError } = useQuery({
    queryKey: ['metastats'],
    queryFn: () => getMetaStats(db),
  })
  const { mutate: changeGoalStatusMutator, error: changingGoalStatusError } = useMutation({
    mutationFn: (param: ChangeGoalStatusParam) => changeGoalStatus(db, param),
    onSuccess: () => {
      onComplete()

      queryClient.invalidateQueries({ queryKey: ['metastats'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goalUpdates'] })
    },
  })

  useErrorToasts(
    { title: 'Error getting meta stats', errorData: metaStatsError },
    { title: 'Error changing goal status', errorData: changingGoalStatusError }
  )

  const [closingMessage, setClosingMessage] = useState('')

  const [metastatGains, setMetastatGains] = useState<Record<number, number>>(
    metastats?.reduce((result, { id }) => ({ ...result, [id]: 0 }), {}) ?? {}
  )

  useEffect(() => {
    setMetastatGains(
      metastats?.reduce((result, { id }) => ({ ...result, [id]: 0 }), {}) ?? {} ?? []
    )
  }, [metastats])

  if (!action) return null

  const actionDetails = actionDetailsMap[action]

  return (
    <BottomSheetView className='pb-safe-offset-4 px-4 gap-2'>
      <Pressable
        onPress={() => {
          Keyboard.dismiss()
        }}
      >
        <View className='flex flex-row justify-center items-center relative mb-4'>
          <Text className='text-accent font-bold text-center text-lg'>{actionDetails.title}</Text>
        </View>
        <View className='flex flex-col gap-5'>
          {!isLongTerm && !!(goal as Goal)?.relatedLtGoals?.length && (
            <RelatedGoals
              goalPreviews={(goal as Goal).relatedLtGoals}
              label='Affected long-term goals'
              color={getGoalColor(goal?.status, true)}
              disableLink
            />
          )}
          {!isLongTerm && !!(goal as Goal)?.consequences?.length && (
            <RelatedGoals
              goalPreviews={(goal as Goal).consequences}
              label='Affected consequences'
              disableLink
            />
          )}
          {!isLongTerm && (action === 'abandon' || action === 'complete') && (
            <View className='flex flex-col gap-2'>
              <Text className='text-fgSecondary text-sm'>Increase meta stats:</Text>
              {metastats?.map(({ name, id }) => (
                <View key={id} className='flex flex-row items-center justify-between gap-2 px-2'>
                  <Text className='text-fg'>{name}</Text>
                  <View className='flex flex-row gap-9'>
                    {metastatGainValues.map(({ label, value }, ind) => (
                      <Pressable
                        key={ind}
                        onPress={() =>
                          setMetastatGains((metastatGains) => ({ ...metastatGains, [id]: value }))
                        }
                      >
                        <Text
                          className='font-bold'
                          style={{
                            color: metastatGains[id] === value ? colors.accent : colors.fgSecondary,
                          }}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
          <View className='flex flex-col gap-2'>
            <Text className='text-fgSecondary text-sm'>{actionDetails.messageLabel}:</Text>
            <BottomSheetTextInput
              className='text-fg bg-bgTertiary rounded-md min-h-24 p-3'
              multiline
              textAlignVertical='top'
              value={closingMessage}
              onChangeText={setClosingMessage}
            />
          </View>
          <AppButton
            text={actionDetails.buttonText}
            onPress={() =>
              changeGoalStatusMutator({
                id,
                status: actionDetailsMap[action].newStatus,
                metastatChanges: Object.entries(metastatGains)
                  .map(([id, value]) => ({ id: Number.parseInt(id), value }))
                  .filter(({ value }) => !!value),
                sentiment: actionDetailsMap[action].sentiment,
                message: closingMessage,
              })
            }
            color={actionDetails.color}
            activeColor={actionDetails.colorActive}
          />
        </View>
      </Pressable>
    </BottomSheetView>
  )
}
