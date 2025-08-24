import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { Goal, LtGoal } from '@/models/goal'
import { SheetModalData } from '@/app/goal/[id]'
import { RelatedGoals } from '@/components/Goal/RelatedGoals'
import { colors, getGoalColor } from '@/common/theme'
import { useQuery } from '@tanstack/react-query'
import { getMetaStats } from '@/models/metastat'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'

const actionDetailsMap: Record<
  SheetModalData['action'],
  { title: string; color: string; colorActive: string; buttonText: string }
> = {
  abandon: {
    title: 'Abandon the goal',
    color: colors.negative,
    colorActive: colors.negativeActive,
    buttonText: 'Abandon',
  },
  complete: {
    title: 'Complete the goal',
    color: colors.positive,
    colorActive: colors.positiveActive,
    buttonText: 'Complete',
  },
  delay: {
    title: 'Delay the goal',
    color: colors.delayedGoal,
    colorActive: colors.delayedGoalActive,
    buttonText: 'Delay',
  },
}

export function GoalSheet({
  id,
  action,
  goal,
  isLongTerm,
}: {
  id: number
  action?: SheetModalData['action']
  goal?: Goal | LtGoal
  isLongTerm: boolean
}) {
  const db = useSQLiteContext()

  const { data: metastats, error: metaStatsError } = useQuery({
    queryKey: ['metastats'],
    queryFn: () => getMetaStats(db),
  })

  useErrorToasts({ title: 'Error getting meta stats', errorData: metaStatsError })

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
          <View className='flex flex-col gap-2'>
            <Text className='text-fgSecondary text-sm'>Increase meta stats:</Text>
            {metastats?.map(({ name, id }) => (
              <View key={id} className='flex flex-row items-center justify-between gap-2 px-2'>
                <Text className='text-fg'>{name}</Text>
                <View className='flex flex-row gap-9'>
                  {['No', 'A bit', 'Considerably'].map((change, ind) => (
                    <Text key={ind} className='text-fgSecondary font-bold'>
                      {change}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <View className='flex flex-col gap-2'>
            <Text className='text-fgSecondary text-sm'>Closing message:</Text>
            <BottomSheetTextInput
              className='bg-bgTertiary rounded-md min-h-24 p-3'
              multiline
              textAlignVertical='top'
            />
          </View>
          <Pressable>
            {({ pressed }) => (
              <Text
                className='p-3 text-center rounded-md font-medium text-lg'
                style={{
                  backgroundColor: pressed ? actionDetails.colorActive : actionDetails.color,
                }}
              >
                {actionDetails.buttonText}
              </Text>
            )}
          </Pressable>
        </View>
      </Pressable>
    </BottomSheetView>
  )
}
