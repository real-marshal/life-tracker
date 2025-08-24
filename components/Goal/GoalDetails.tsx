import { Text, View } from 'react-native'
import { progressTextMap } from '@/components/Goal/constants'
import { formatDurationTwoLongValues } from '@/common/utils/date'
import { Trackers } from '@/components/Tracker/Trackers'
import { Goal, LtGoal } from '@/models/goal'
import { RelatedGoals } from './RelatedGoals'
import { getGoalColor } from '@/common/theme'

export function GoalDetails({
  goal,
  isLongTerm,
  accentColor,
}: {
  goal?: Goal | LtGoal
  isLongTerm: boolean
  accentColor: string
}) {
  const formattedDuration =
    goal?.progressDuration && formatDurationTwoLongValues(goal?.progressDuration)

  const formattedCreatedAt = goal?.createdAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })

  return (
    <View className='flex flex-col gap-4 p-4 bg-bgSecondary rounded-lg border-hairline border-[#444]'>
      <View className='flex flex-row flex-wrap'>
        <Text className='text-fgSecondary text-lg'>
          {goal?.status && progressTextMap[goal?.status][0]}
        </Text>
        <Text className='font-bold text-lg' style={{ color: accentColor }}>
          {formattedDuration}
        </Text>
        <Text className='text-fgSecondary text-lg'>
          {goal?.status && progressTextMap[goal?.status][1]}
        </Text>
        <Text className='font-bold text-lg' style={{ color: accentColor }}>
          {formattedCreatedAt}
        </Text>
      </View>
      {goal?.why && (
        <View className='flex flex-col gap-[2]'>
          <Text className='text-fgSecondary text-sm'>Why:</Text>
          <Text className='text-fg leading-5'>{goal?.why}</Text>
        </View>
      )}
      {!!goal?.relatedTrackers?.length && (
        <View className='flex flex-col gap-1'>
          <Text className='text-fgSecondary text-sm'>Related trackers:</Text>
          <Trackers trackers={goal.relatedTrackers} />
        </View>
      )}
      {!isLongTerm && !!(goal as Goal)?.prerequisites?.length && (
        <RelatedGoals goalPreviews={(goal as Goal).prerequisites} label='Prerequisites' />
      )}
      {!isLongTerm && !!(goal as Goal)?.consequences?.length && (
        <RelatedGoals goalPreviews={(goal as Goal).consequences} label='Consequences' />
      )}
      {isLongTerm && !!(goal as LtGoal)?.relatedGoals?.length && (
        <RelatedGoals goalPreviews={(goal as LtGoal).relatedGoals} label='Related goals' />
      )}
      {isLongTerm && !!(goal as LtGoal)?.delayedRelatedGoals?.length && (
        <RelatedGoals
          goalPreviews={(goal as LtGoal).delayedRelatedGoals}
          label='Delayed related goals'
          color={getGoalColor('delayed')}
        />
      )}
      {isLongTerm && !!(goal as LtGoal)?.completedRelatedGoals?.length && (
        <RelatedGoals
          goalPreviews={(goal as LtGoal).completedRelatedGoals}
          label='Completed related goals'
          color={getGoalColor('completed')}
        />
      )}
      {isLongTerm && !!(goal as LtGoal)?.abandonedRelatedGoals?.length && (
        <RelatedGoals
          goalPreviews={(goal as LtGoal).abandonedRelatedGoals}
          label='Abandoned related goals'
          color={getGoalColor('abandoned')}
        />
      )}
    </View>
  )
}
