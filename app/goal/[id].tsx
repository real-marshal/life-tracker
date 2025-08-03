import { View, Text, Pressable, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLoader } from '@/hooks/useLoader'
import { getGoal, getLtGoal, Goal } from '@/models/goal'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { colors, goalStatusColorMap, goalUpdateColorMap } from '@/common/theme'
import Feather from '@expo/vector-icons/Feather'
import { formatDateSmart, formatDurationTwoLongValues } from '@/common/utils/date'
import { Trackers } from '@/components/Trackers'
import { GoalPreviewItem } from '@/components/Goals'
import { getGoalUpdates, GoalUpdate } from '@/models/goalUpdate'
import { getCalendars } from 'expo-localization'

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

  const [goal, , goalError] = useLoader(
    isLongTerm ? getLtGoal : getGoal,
    db,
    Number.parseInt(id as string)
  )
  const [goalUpdates, , goalUpdatesError] = useLoader(
    getGoalUpdates,
    db,
    Number.parseInt(id as string)
  )

  const goalUpdatesByDate =
    goalUpdates?.reduce(
      (result, goalUpdate) => {
        const date = goalUpdate.createdAt.date.toDateString()

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
    <ScrollView>
      <View className='m-safe p-3 pb-5 flex flex-col gap-6'>
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
        <View className='flex flex-col gap-4'>
          {Object.values(goalUpdatesByDate).map((dateGoalUpdates) => {
            const date = formatDateSmart(dateGoalUpdates[0].createdAt)

            return (
              <View key={date} className='flex flex-col gap-2'>
                <Text className='text-fgSecondary text-center font-light border-b-hairline border-fgSecondary pb-[1] text-lg'>
                  {date}
                </Text>
                <View className='flex flex-col gap-3'>
                  {dateGoalUpdates.map(({ id, content, createdAt, sentiment }) => (
                    <View key={id} className='flex flex-col gap-1'>
                      <Text className='text-fgSecondary text-xs'>
                        {createdAt.date.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: !getCalendars()[0].uses24hourClock,
                        })}
                      </Text>
                      <Text
                        className='text-fg bg-bgSecondary p-3 border-l-2 rounded-md leading-5'
                        style={{ borderColor: goalUpdateColorMap[sentiment] }}
                      >
                        {content}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}
