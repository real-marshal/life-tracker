import { View, Text, Pressable } from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { getUser } from '@/models/user'
import { useLoader } from '@/hooks/useLoader'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { stringifyError } from '@/common/utils/error'
import Toast from 'react-native-toast-message'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { getMetaStats, MetaStat } from '@/models/metastat'
import { getTrackers, Tracker } from '@/models/tracker'
import { getGoals, getLtGoals, GoalPreviewRender, LtGoalPreviewRender } from '@/models/goal'

export default function HomeScreen() {
  const db = useSQLiteContext()
  const router = useRouter()

  const [user, userIsLoading, error] = useLoader(getUser, db)
  const [metastats, metastatsAreLoading, metaStatsError] = useLoader(getMetaStats, db)
  const [trackers, trackersAreLoading, trackersError] = useLoader(getTrackers, db)
  const [ltGoals, ltGoalsAreLoading, ltGoalsError] = useLoader(getLtGoals, db)
  const [goals, goalsAreLoading, goalsError] = useLoader(getGoals, db)

  useEffect(() => {
    if (!userIsLoading && !error && !user?.isOnboarded) {
      router.replace('/onboard')
    }
  }, [error, router, user?.isOnboarded, userIsLoading])

  useEffect(() => {
    error &&
      Toast.show({ type: 'error', text1: 'Error getting user data', text2: stringifyError(error) })
  }, [error])

  return (
    <View className='m-safe-offset-5 flex flex-col gap-6'>
      <View className='flex flex-col gap-1'>
        <View className='flex flex-row gap-3 justify-between items-center'>
          <Text className='text-fg text-2xl font-light'>
            Today is{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Pressable onPress={() => router.push('/settings')}>
            <Feather name='settings' size={20} color={colors.fg} />
          </Pressable>
        </View>
        <Text className='text-accent text-4xl'>Hi, {user?.name}</Text>
      </View>
      <View className='flex flex-col gap-2'>
        <SectionTitle>Meta stats</SectionTitle>
        <View className='flex flex-col gap-1'>
          {metastats?.map((metastat) => (
            <MetastatItem {...metastat} key={metastat.id} />
          ))}
        </View>
      </View>
      <View className='flex flex-col gap-2'>
        <SectionTitle>Stats</SectionTitle>
        <View className='flex flex-row gap-2 flex-wrap'>
          {trackers?.map((tracker) => (
            <TrackerItem {...tracker} key={tracker.id} />
          ))}
        </View>
      </View>
      <View className='flex flex-col gap-2'>
        <SectionTitle>Long-term</SectionTitle>
        <View className='flex flex-col gap-2 flex-wrap'>
          {ltGoals?.map((ltGoal) => (
            <LtGoalPreviewItem {...ltGoal} key={ltGoal.id} />
          ))}
        </View>
      </View>
      <View className='flex flex-col gap-2'>
        <SectionTitle>Current</SectionTitle>
        <View className='flex flex-col gap-2 flex-wrap'>
          {goals?.map((goal) => (
            <GoalPreviewItem {...goal} key={goal.id} />
          ))}
        </View>
      </View>
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className='text-fg font-light uppercase text-md border-b-hairline border-fgSecondary pb-2 tracking-widest'>
      {children}
    </Text>
  )
}

function MetastatItem({ id, name, value, level }: MetaStat) {
  return (
    <View key={id} className='flex flex-row gap-3 justify-between items-center'>
      <View className='flex flex-row gap-2 min-w-32 justify-between'>
        <Text className='text-fg'>{name}</Text>
        {typeof level === 'number' && <Text className='text-fg'>{level}</Text>}
      </View>
      <View className='flex-grow h-[hairlineWidth()] bg-fgSecondary relative rounded-sm'>
        <View
          className='h-[3] bg-fg absolute top-[-1] rounded-sm'
          style={{ width: `${value * 100}%` }}
        />
      </View>
    </View>
  )
}

function TrackerItem({ id, name, renderData, ...typeSpecificData }: Tracker) {
  const shownValue =
    typeSpecificData.type === 'date'
      ? typeSpecificData.date.toString()
      : `${typeSpecificData.prefix ?? ''}${typeSpecificData.value}${typeSpecificData.suffix ?? ''}`

  return (
    <View className='flex flex-row gap-2 grow bg-bgSecondary p-2 px-4 rounded-lg justify-between'>
      <Text className='text-fgSecondary'>{name}:</Text>
      <Text className='text-fg font-bold'>{shownValue}</Text>
    </View>
  )
}

function LtGoalPreviewItem({ id, name, relatedGoalsNum, completedGoalsNum }: LtGoalPreviewRender) {
  return (
    <View className='flex flex-row gap-2 justify-between'>
      <View className='flex flex-row gap-2 items-center'>
        <View className='w-[6] h-[6] bg-ltGoal rounded-sm' />
        <Text className='text-fg text-lg'>{name}</Text>
      </View>
      <View className='flex flex-row gap-2'>
        <View className='flex flex-row gap-1 items-center'>
          <Feather name='link' size={16} color={colors.currentGoal} />
          <Text className='text-fg text-lg font-bold'>{relatedGoalsNum}</Text>
        </View>
        <View className='flex flex-row gap-1 items-center'>
          <Feather name='check' size={16} color={colors.positive} />
          <Text className='text-fg text-lg font-bold'>{completedGoalsNum}</Text>
        </View>
      </View>
    </View>
  )
}

function GoalPreviewItem({ id, name }: GoalPreviewRender) {
  return (
    <View className='flex flex-row gap-2 items-center'>
      <View className='w-[6] h-[6] bg-currentGoal rounded-sm' />
      <Text className='text-fg text-lg'>{name}</Text>
    </View>
  )
}
