import { View, Text, ScrollView } from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { getUser } from '@/models/user'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import Feather from '@expo/vector-icons/Feather'
import { colors, getGoalColor } from '@/common/theme'
import { getMetaStats } from '@/models/metastat'
import { getTrackers } from '@/models/tracker'
import {
  getArchiveGoals,
  getDelayedGoals,
  getGoals,
  getLtGoals,
  GoalPreviewRender,
  LtGoalPreviewRender,
  updateGoalIndices,
} from '@/models/goal'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { TodaySection } from '@/components/TodaySection'
import { Trackers } from '@/components/Tracker/Trackers'
import { SectionTitle } from '@/components/SectionTitle'
import { GoalPreviewItem, GoalSection, LtGoalPreviewItem } from '@/components/Goal/Goals'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FloatingButton, FloatingMenuItem } from '@/components/FloatingMenu'
import { useFloatingMenu } from '@/hooks/useFloatingMenu'
import { Popover } from '@/components/Popover'
import { Pressable } from 'react-native-gesture-handler'
import { Metastats } from '@/components/Metastat/Metastats'
import { SortableList } from '@/components/SortableList'
import { SortableGridRenderItem } from 'react-native-sortables'
import { Backdrop } from '@/components/Backdrop'
import { NewGoalModal } from '@/components/Goal/NewGoalModal'
import { useModal } from '@/components/Modal'
import { useMetastatsAutodecay } from '@/components/Metastat/common'

export default function HomeScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const queryClient = useQueryClient()

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
    queryKey: ['goals', 'active'],
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

  const { mutate: updateLtGoalIndexMutator, error: updatingLtError } = useMutation({
    mutationFn: (param: { id: number; index: number }[]) => updateGoalIndices(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', 'longterm'] }),
  })
  const { mutate: updateGoalIndexMutator, error: updatingError } = useMutation({
    mutationFn: (param: { id: number; index: number }[]) => updateGoalIndices(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', 'active'] }),
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
    { title: 'Error getting archive goals', errorData: archiveGoalsError },
    { title: 'Error updating LT goal indexes', errorData: updatingLtError },
    { title: 'Error updating goal indexes', errorData: updatingError }
  )

  useMetastatsAutodecay(metastats ?? [])

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = useFloatingMenu()
  const {
    showModal: showNewGoalModal,
    hideModal: hideNewGoalModal,
    ...newGoalModalProps
  } = useModal()

  const [newGoalType, setNewGoalType] = useState<'normal' | 'longterm'>('normal')

  return (
    <>
      <ScrollView>
        <View className='m-safe pt-5 pb-3 px-1 flex flex-col gap-6'>
          <View className='flex flex-col gap-1 px-2'>
            <View className='flex flex-row gap-3 justify-between items-center'>
              <TodaySection />
              <Pressable onPress={() => router.navigate('/settings')}>
                {({ pressed }) => (
                  <Feather
                    name='settings'
                    size={20}
                    color={pressed ? colors.fgSecondary : colors.fg}
                  />
                )}
              </Pressable>
            </View>
            <Text className='text-accent text-4xl'>Hi, {user?.name}</Text>
          </View>
          <View className='flex flex-col gap-2 px-2'>
            <SectionTitle>Meta stats</SectionTitle>
            <View className='flex flex-col'>
              {metastats && <Metastats metastats={metastats} />}
            </View>
          </View>
          <View className='flex flex-col gap-2 px-2'>
            <SectionTitle>Trackers</SectionTitle>
            {trackers && <Trackers trackers={trackers} />}
          </View>
          <GoalSection title='Long-term'>
            <SortableList
              data={ltGoals ?? []}
              renderItem={useCallback<SortableGridRenderItem<LtGoalPreviewRender>>(
                ({ item }) => (
                  <LtGoalPreviewItem {...item} />
                ),
                []
              )}
              updateIndexes={updateLtGoalIndexMutator}
            />
          </GoalSection>
          <GoalSection title='Current'>
            <SortableList
              data={goals ?? []}
              renderItem={useCallback<SortableGridRenderItem<GoalPreviewRender>>(
                ({ item }) => (
                  <GoalPreviewItem {...item} color={getGoalColor(item.status)} draggable />
                ),
                []
              )}
              updateIndexes={updateGoalIndexMutator}
            />
          </GoalSection>
          <GoalSection title='Delayed'>
            {delayedGoals?.map((goal) => (
              <GoalPreviewItem {...goal} color={getGoalColor('delayed')} key={goal.id} />
            ))}
          </GoalSection>
          <GoalSection title='Archive'>
            {archiveGoals?.map((goal) => (
              <GoalPreviewItem {...goal} color={getGoalColor(goal.status)} key={goal.id} />
            ))}
          </GoalSection>
        </View>
      </ScrollView>

      {isPopoverShown && (
        <Backdrop
          onPress={() => {
            hidePopover()
          }}
        />
      )}

      <FloatingButton
        onPress={() => (isPopoverShown ? hidePopover() : showPopover())}
        color={colors.accent}
        activeColor={colors.accentActive}
        active={isPopoverShown}
      />
      <Popover
        isOpen={isPopoverShown}
        className='right-safe-offset-7 bottom-[90px] z-[9999999]'
        animatedStyle={animatedStyle}
      >
        <FloatingMenuItem
          description='Marking something abstract?'
          onPress={() => {
            router.navigate('/add-metastat')
            hidePopover()
          }}
        >
          <FloatingMenuItem.Text>Add a </FloatingMenuItem.Text>
          <FloatingMenuItem.Text color={colors.accent}>meta stat</FloatingMenuItem.Text>
        </FloatingMenuItem>
        <FloatingMenuItem description='Want to keep track of something?' onPress={() => null}>
          <FloatingMenuItem.Text>Add a </FloatingMenuItem.Text>
          <FloatingMenuItem.Text color={colors.accent}>tracker</FloatingMenuItem.Text>
        </FloatingMenuItem>
        <FloatingMenuItem
          description='Charting the course?'
          onPress={() => {
            setNewGoalType('longterm')
            showNewGoalModal()
            hidePopover()
          }}
        >
          <FloatingMenuItem.Text>Add a </FloatingMenuItem.Text>
          <FloatingMenuItem.Text color={colors.accent}>long-term goal</FloatingMenuItem.Text>
        </FloatingMenuItem>
        <FloatingMenuItem
          description='Got any ideas?'
          onPress={() => {
            setNewGoalType('normal')
            showNewGoalModal()
            hidePopover()
          }}
        >
          <FloatingMenuItem.Text>Add a </FloatingMenuItem.Text>
          <FloatingMenuItem.Text color={colors.accent}>goal</FloatingMenuItem.Text>
        </FloatingMenuItem>
        <FloatingMenuItem description='Made some progress?' onPress={() => null}>
          <FloatingMenuItem.Text>Add </FloatingMenuItem.Text>
          <FloatingMenuItem.Text color={colors.accent}>updates</FloatingMenuItem.Text>
        </FloatingMenuItem>
      </Popover>
      <NewGoalModal
        hideModal={hideNewGoalModal}
        modalProps={newGoalModalProps}
        isLongTerm={newGoalType === 'longterm'}
      />
    </>
  )
}
