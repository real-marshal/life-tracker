import { GoalPreview, LtGoalPreviewRender } from '@/models/goal'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/common/theme'
import { SectionTitle } from '@/components/SectionTitle'
import Feather from '@expo/vector-icons/Feather'
import { cn } from '@/common/utils/css'
import { ReactNode } from 'react'
import { PressableWrapper } from '@/components/Pressable'

export function GoalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className='flex flex-col gap-1'>
      <SectionTitle className='px-2'>{title}</SectionTitle>
      <View className='flex flex-col flex-wrap'>{children}</View>
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
  draggable,
  type,
}: Omit<GoalPreview, 'status'> & {
  color: string
  small?: boolean
  disableLink?: boolean
  className?: string
  draggable?: boolean
}) {
  const router = useRouter()

  return (
    <PressableWrapper
      onPress={() =>
        !disableLink &&
        router.navigate({
          pathname: '/goal/[id]',
          params: { id, type },
        })
      }
      className={cn(
        'flex flex-row gap-3 items-center py-1 px-2 rounded-lg w-full',
        {
          'active:bg-bgTertiary': !disableLink,
        },
        className
      )}
      draggable={draggable}
    >
      <View
        className='w-[6] h-[6] rounded-sm'
        style={{
          backgroundColor: color,
        }}
      />
      <Text className={`text-fg ${small ? 'text-md' : 'text-xl'}`}>{name}</Text>
    </PressableWrapper>
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
    <PressableWrapper
      onPress={() => router.navigate({ pathname: '/goal/[id]', params: { id, type: 'longterm' } })}
      className='flex flex-row gap-3 justify-between py-1 px-2 active:bg-bgTertiary rounded-lg'
      draggable
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
    </PressableWrapper>
  )
}
