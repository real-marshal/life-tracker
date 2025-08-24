import { GoalPreview } from '@/models/goal'
import { Text, View } from 'react-native'
import { GoalPreviewItem } from '@/components/Goal/Goals'
import { getGoalColor } from '@/common/theme'

export function RelatedGoals({
  goalPreviews,
  label,
  color,
  disableLink,
}: {
  goalPreviews: GoalPreview[]
  label: string
  color?: string
  disableLink?: boolean
}) {
  return (
    <View className='flex flex-col gap-[2]'>
      <Text className='text-fgSecondary text-sm'>
        {label} ({goalPreviews.length}):
      </Text>
      <View className='flex flex-col flex-wrap'>
        {goalPreviews.map((goal) => (
          <GoalPreviewItem
            {...goal}
            key={goal.id}
            small
            color={color ?? getGoalColor(goal.status)}
            disableLink={disableLink}
          />
        ))}
      </View>
    </View>
  )
}
