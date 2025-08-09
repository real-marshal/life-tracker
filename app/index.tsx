import { View, Text, Pressable, ScrollView } from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { getUser } from '@/models/user'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { getMetaStats } from '@/models/metastat'
import { getTrackers } from '@/models/tracker'
import { getArchiveGoals, getDelayedGoals, getGoals, getLtGoals } from '@/models/goal'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { TodaySection } from '@/components/TodaySection'
import { Trackers } from '@/components/Tracker/Trackers'
import { SectionTitle } from '@/components/SectionTitle'
import { GoalsSection, LtGoalPreviewItem } from '@/components/Goals'
import { MetastatItem } from '@/components/MetastatItem'
import { useQuery } from '@tanstack/react-query'

export default function HomeScreen() {
  const db = useSQLiteContext()
  const router = useRouter()

  const {
    data: user,
    error: userError,
    isLoading: userIsLoading,
    isFetching: userIsFetching,
  } = useQuery({ queryKey: ['user'], queryFn: () => getUser(db) })
  const { data: metastats, error: metaStatsError } = useQuery({
    queryKey: ['metastats'],
    queryFn: () => getMetaStats(db),
  })
  const { data: trackers, error: trackersError } = useQuery({
    queryKey: ['trackers'],
    queryFn: () => getTrackers(db),
  })
  const { data: ltGoals, error: ltGoalsError } = useQuery({
    queryKey: ['goals', 'longterm'],
    queryFn: () => getLtGoals(db),
  })
  const { data: goals, error: goalsError } = useQuery({
    queryKey: ['goals', 'normal'],
    queryFn: () => getGoals(db),
  })
  const { data: delayedGoals, error: delayedGoalsError } = useQuery({
    queryKey: ['goals', 'delayed'],
    queryFn: () => getDelayedGoals(db),
  })
  const { data: archiveGoals, error: archiveGoalsError } = useQuery({
    queryKey: ['goals', 'archive'],
    queryFn: () => getArchiveGoals(db),
  })

  useEffect(() => {
    if (!userIsLoading && !userIsFetching && !userError && !user?.isOnboarded) {
      router.replace('/onboard')
    }
  }, [userError, router, user?.isOnboarded, userIsLoading, userIsFetching])

  useErrorToasts(
    { title: 'Error getting user data', errorData: userError },
    { title: 'Error getting meta stats', errorData: metaStatsError },
    { title: 'Error getting trackers', errorData: trackersError },
    { title: 'Error getting LT goals', errorData: ltGoalsError },
    { title: 'Error getting goals', errorData: goalsError },
    { title: 'Error getting delayed goals', errorData: delayedGoalsError },
    { title: 'Error getting archive goals', errorData: archiveGoalsError }
  )

  return (
    <ScrollView>
      <View className='m-safe pt-5 pb-3 px-1 flex flex-col gap-6'>
        <View className='flex flex-col gap-1 px-2'>
          <View className='flex flex-row gap-3 justify-between items-center'>
            <TodaySection />
            <Pressable onPress={() => router.navigate('/settings')}>
              <Feather name='settings' size={20} color={colors.fg} />
            </Pressable>
          </View>
          <Text className='text-accent text-4xl'>Hi, {user?.name}</Text>
        </View>
        <View className='flex flex-col gap-2 px-2'>
          <SectionTitle>Meta stats</SectionTitle>
          <View className='flex flex-col gap-1'>
            {metastats?.map((metastat) => (
              <MetastatItem {...metastat} key={metastat.id} />
            ))}
          </View>
        </View>
        <View className='flex flex-col gap-2 px-2'>
          <SectionTitle>Trackers</SectionTitle>
          {trackers && <Trackers trackers={trackers} />}
        </View>
        <View className='flex flex-col gap-1'>
          <SectionTitle className='px-2'>Long-term</SectionTitle>
          <View className='flex flex-col flex-wrap'>
            {ltGoals?.map((ltGoal) => (
              <LtGoalPreviewItem {...ltGoal} key={ltGoal.id} />
            ))}
          </View>
        </View>
        <GoalsSection goals={goals} title='current' status='active' />
        <GoalsSection goals={delayedGoals} title='delayed' status='delayed' />
        <GoalsSection goals={archiveGoals} title='archive' />
      </View>
    </ScrollView>
  )
}
