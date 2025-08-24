import { Goal, GoalPreview, GoalPreviewRender, LtGoalPreviewRender } from '@/models/goal'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, getGoalColor } from '@/common/theme'
import { SectionTitle } from '@/components/SectionTitle'
import Feather from '@expo/vector-icons/Feather'
import { cn } from '@/common/utils/css'

export function GoalsSection({
  title,
  goals,
  status,
}: {
  title: string
  goals?: (GoalPreviewRender | GoalPreview)[]
  status?: Goal['status']
}) {
  return (
    <View className='flex flex-col gap-1'>
      <SectionTitle className='px-2'>{title}</SectionTitle>
      <View className='flex flex-col flex-wrap'>
        {goals?.map((goal) => (
          <GoalPreviewItem {...goal} color={getGoalColor(goal.status ?? status)} key={goal.id} />
        ))}
      </View>
    </View>
  )
}

export function GoalPreviewItem({
  id,
  name,
  color,
  small,
  disableLink,
  className,
}: Omit<GoalPreview, 'status'> & {
  color: string
  small?: boolean
  disableLink?: boolean
  className?: string
}) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => !disableLink && router.navigate({ pathname: '/goal/[id]', params: { id } })}
      className={cn(
        'flex flex-row gap-3 items-center py-1 px-2 rounded-lg w-full',
        {
          'active:bg-bgTertiary': !disableLink,
        },
        className
      )}
    >
      <View
        className='w-[6] h-[6] rounded-sm'
        style={{
          backgroundColor: color,
        }}
      />
      <Text className={`text-fg ${small ? 'text-md' : 'text-xl'}`}>{name}</Text>
    </Pressable>
  )
}

export function LtGoalPreviewItem({
  id,
  name,
  relatedGoalsNum,
  completedGoalsNum,
}: LtGoalPreviewRender) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.navigate({ pathname: '/goal/[id]', params: { id, type: 'longterm' } })}
      className='flex flex-row gap-3 justify-between py-1 px-2 active:bg-bgTertiary rounded-lg'
    >
      <View className='flex flex-row gap-3 items-center'>
        <View className='w-[6] h-[6] bg-ltGoal rounded-sm' />
        <Text className='text-fg text-xl'>{name}</Text>
      </View>
      <View className='flex flex-row gap-3'>
        <View className='flex flex-row gap-[3] items-center'>
          <Feather name='link' size={14} color={colors.currentGoal} />
          <Text className='text-fg text-xl font-bold'>{relatedGoalsNum}</Text>
        </View>
        <View className='flex flex-row gap-[2] items-center'>
          <Feather name='check' size={17} color={colors.positive} />
          <Text className='text-fg text-xl font-bold'>{completedGoalsNum}</Text>
        </View>
      </View>
    </Pressable>
  )
}
