import { View, Text, Pressable, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLoader } from '@/hooks/useLoader'
import { getGoal, getLtGoal, Goal } from '@/models/goal'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { colors, goalStatusColorMap } from '@/common/theme'
import Feather from '@expo/vector-icons/Feather'
import { formatDurationTwoLongValues } from '@/common/utils/date'
import { Trackers } from '@/components/Trackers'
import { GoalPreviewItem } from '@/components/Goals'
import { getGoalUpdates, GoalUpdate } from '@/models/goal_update'

const progressTextMap: Record<Goal['status'], [string, string]> = {
  active: ['In progress for ', ' since '],
  delayed: ['In progress for ', ' since '],
  completed: ['Completed in ', ', started '],
  abandoned: ['Abandoned after ', ', started '],
}

export default function GoalScreen() {
  const { id, type } = useLocalSearchParams()
  const db = useSQLiteContext()
  const router = useRouter()

  const isLongTerm = type === 'longterm'

  const [goal, goalIsLoading, goalError] = useLoader(
    isLongTerm ? getLtGoal : getGoal,
    db,
    Number.parseInt(id as string)
  )
  const [goalUpdates, goalUpdatesAreLoading, goalUpdatesError] = useLoader(
    getGoalUpdates,
    db,
    Number.parseInt(id as string)
  )

  const goalUpdatesByDate =
    goalUpdates?.reduce(
      (result, goalUpdate) => {
        const date = goalUpdate.createdAt.toDateString()

        result[date] ??= []
        result[date].push(goalUpdate)

        return result
      },
      {} as Record<string, GoalUpdate[]>
    ) ?? {}

  const accentColor =
    goal?.status && goal.status !== 'active'
      ? goalStatusColorMap[goal.status]
      : isLongTerm
        ? colors.ltGoal
        : colors.currentGoal

  useErrorToasts(
    { title: 'Error loading a goal', errorData: goalError },
    { title: 'Error loading goal updates', errorData: goalUpdatesError }
  )

  return (
    <ScrollView className='m-safe p-3 flex flex-col gap-6'>
      <View className='flex flex-row gap-2 items-center justify-between'>
        <View className='flex flex-row gap-4 items-center flex-1'>
          <Pressable onPress={() => router.back()}>
            <Feather name='chevron-left' size={30} color={accentColor} />
          </Pressable>
          <Text
            className='text-fg text-2xl flex-1'
            style={{ color: accentColor }}
            numberOfLines={2}
            ellipsizeMode='tail'
          >
            {goal?.name}
          </Text>
        </View>
        <Feather name='more-horizontal' size={24} color={accentColor} />
      </View>
      <View className='flex flex-col gap-4 p-4 bg-bgSecondary rounded-lg border-hairline border-[#444] '>
        <View className='flex flex-row flex-wrap'>
          <Text className='text-fgSecondary'>
            {goal?.status && progressTextMap[goal?.status][0]}
          </Text>
          <Text className='font-bold' style={{ color: accentColor }}>
            {goal?.progressDuration && formatDurationTwoLongValues(goal?.progressDuration)}
          </Text>
          <Text className='text-fgSecondary'>
            {goal?.status && progressTextMap[goal?.status][1]}
          </Text>
          <Text className='font-bold' style={{ color: accentColor }}>
            {goal?.createdAt.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        {goal?.why && (
          <View className='flex flex-col gap-[2]'>
            <Text className='text-fgSecondary text-sm'>Why:</Text>
            <Text className='text-fg'>{goal?.why}</Text>
          </View>
        )}
        {!!goal?.relatedTrackers?.length && (
          <View className='flex flex-col gap-1'>
            <Text className='text-fgSecondary text-sm'>Related trackers:</Text>
            <Trackers trackers={goal.relatedTrackers} />
          </View>
        )}
        {!isLongTerm && !!(goal as Goal)?.prerequisites?.length && (
          <View className='flex flex-col gap-[2]'>
            <Text className='text-fgSecondary text-sm'>
              Prerequisites ({(goal as Goal).prerequisites.length}):
            </Text>
            <View className='flex flex-col flex-wrap'>
              {(goal as Goal).prerequisites?.map((goal) => (
                <GoalPreviewItem {...goal} key={goal.id} small />
              ))}
            </View>
          </View>
        )}
        {!isLongTerm && !!(goal as Goal)?.consequences?.length && (
          <View className='flex flex-col gap-[2]'>
            <Text className='text-fgSecondary text-sm'>
              Consequences ({(goal as Goal).consequences.length}):
            </Text>
            <View className='flex flex-col flex-wrap'>
              {(goal as Goal).consequences?.map((goal) => (
                <GoalPreviewItem {...goal} key={goal.id} small />
              ))}
            </View>
          </View>
        )}
      </View>
      {Object.values(goalUpdatesByDate).map((dateGoalUpdates) => {
        const date = dateGoalUpdates[0].createdAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })

        return (
          <View key={date} className='flex flex-col gap-2'>
            <Text className='text-fgSecondary text-center font-light'>{date}</Text>
            <View className='flex flex-col gap-2'>
              {dateGoalUpdates.map(({ id, content, createdAt }) => (
                <View key={id} className='flex flex-col gap-[1]'>
                  <Text className='text-fgSecondary text-sm'>
                    {createdAt.toLocaleDateString('en-US', {
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </Text>
                  <Text className='text-fg bg-bgSecondary'>{content}</Text>
                </View>
              ))}
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}
