import { View, Text, ScrollView } from 'react-native'
import { useSQLiteContext } from 'expo-sqlite'
import { getUser, markUserAsFinishedOnboardingTooltips } from '@/models/user'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import { SheetModalSelect } from '@/components/SheetModalSelect'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { OnboardingTooltip, useOnboardingTooltips } from '@/components/OnboardingTooltip'

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

  const {
    mutate: markUserAsFinishedOnboardingTooltipsMutator,
    error: finishingOnboardingTooltipsError,
  } = useMutation({
    mutationFn: () => markUserAsFinishedOnboardingTooltips(db),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
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
    { title: 'Error updating goal indexes', errorData: updatingError },
    {
      title: 'Error marking user as finished onboarding tooltips',
      errorData: finishingOnboardingTooltipsError,
    }
  )

  useMetastatsAutodecay(metastats ?? [])

  const { isPopoverShown, hidePopover, showPopover, animatedStyle } = useFloatingMenu()
  const {
    showModal: showNewGoalModal,
    hideModal: hideNewGoalModal,
    ...newGoalModalProps
  } = useModal()

  const [newGoalType, setNewGoalType] = useState<'normal' | 'longterm'>('normal')

  const trackerTypeSheetRef = useRef<BottomSheetModal>(null)

  const [shouldShowOnboardingTooltips, setShouldShowOnboardingTooltips] = useState<boolean>(false)

  const onboardingTooltipsTimeoutRef = useRef<number>(null)

  useEffect(() => {
    onboardingTooltipsTimeoutRef.current = setTimeout(
      () => !user?.areOnboardingTooltipsFinished && setShouldShowOnboardingTooltips(true),
      1000
    )

    return () => {
      onboardingTooltipsTimeoutRef.current && clearTimeout(onboardingTooltipsTimeoutRef.current)
    }
  }, [user?.areOnboardingTooltipsFinished])

  const onboardingTooltipsControls = useOnboardingTooltips({
    labels: ['metastats', 'trackers', 'lt-goals', 'goals'] as const,
    areShown: shouldShowOnboardingTooltips,
    onFinish: () => {
      markUserAsFinishedOnboardingTooltipsMutator()
      setShouldShowOnboardingTooltips(false)
    },
  })

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
          <OnboardingTooltip
            label='metastats'
            renderTooltip={() => (
              <>
                <Text className='text-fg leading-6'>
                  <Text className='text-accent'>Meta stats</Text> are used to track something that
                  is not tangible and may increase as a result of completing your goals. If not
                  increased in some period of time, they start to{' '}
                  <Text className='text-accent'>decay</Text> daily depending on the speed you set.
                  Nothing in real life lasts forever.
                </Text>
                <Text className='text-fg leading-6'>
                  The number indicates the meta stat <Text className='text-accent'>level</Text>{' '}
                  which is increased every time you fill the bar.{' '}
                  <Text className='text-accent'>Capped</Text> meta stats don't have a level
                  associated with them, which is useful for tracking things that have a obvious
                  limit.
                </Text>
                <Text className='text-fg leading-6'>
                  You can <Text className='text-accent'>reorder</Text> meta stats by long-pressing
                  and dragging one. Try now!
                </Text>
              </>
            )}
            {...onboardingTooltipsControls}
          >
            <View className='flex flex-col gap-2 px-2'>
              <SectionTitle>Meta stats</SectionTitle>
              <View className='flex flex-col'>
                {metastats && <Metastats metastats={metastats} />}
              </View>
            </View>
          </OnboardingTooltip>
          <OnboardingTooltip
            label='trackers'
            renderTooltip={() => (
              <>
                <Text className='text-fg leading-6'>
                  <Text className='text-accent'>Stat trackers</Text> help you to see your progress
                  over time while <Text className='text-accent'>date trackers</Text> serve as a
                  constant reminder about some specific day.
                </Text>
                <Text className='text-fg leading-6'>
                  They can be <Text className='text-accent'>reordered</Text> in the same way by
                  dragging and <Text className='text-accent'>linked</Text> to specific goals on the
                  goal screen menu.
                </Text>
              </>
            )}
            {...onboardingTooltipsControls}
          >
            <View className='flex flex-col gap-2 px-2'>
              <SectionTitle>Trackers</SectionTitle>
              {trackers && <Trackers trackers={trackers} />}
            </View>
          </OnboardingTooltip>
          <OnboardingTooltip
            label='lt-goals'
            renderTooltip={() => (
              <>
                <Text className='text-fg leading-6'>
                  <Text className='text-accent'>Long-term</Text> are goals that you want to achieve
                  at some point in the future. They lack clear, specific steps and exist mostly as{' '}
                  <Text className='text-accent'>a reminder, a beacon of sorts</Text>, that guides
                  you to your desired self.
                </Text>
                <Text className='text-fg leading-6'>
                  Your current goals should reflect these long-term goals. There’s{' '}
                  <Text className='text-accent'>no point in creating too many of them</Text>, 2-4
                  should be plenty enough, otherwise, you will always wonder what to focus on.
                </Text>
                <Text className='text-fg leading-6'>
                  Long-term goals can be <Text className='text-accent'>reordered</Text> too.
                </Text>
              </>
            )}
            {...onboardingTooltipsControls}
          >
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
          </OnboardingTooltip>

          <OnboardingTooltip
            label='goals'
            top
            renderTooltip={() => (
              <>
                <Text className='text-fg leading-6'>
                  And finally, <Text className='text-accent'>current</Text> goals are the ones
                  you’re progressing towards right now, consistently making efforts to achieve them.
                </Text>
                <Text className='text-fg leading-6'>
                  As you move forward, you will inevitably face challenges or learn something new
                  about the topic. You can make notes of these new developments by creating{' '}
                  <Text className='text-accent'>goal updates</Text> on the goal screen.
                </Text>
                <Text className='text-fg leading-6'>
                  As always, you can also <Text className='text-accent'>reorder</Text> current goals
                  by dragging.
                </Text>
              </>
            )}
            {...onboardingTooltipsControls}
          >
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
          </OnboardingTooltip>
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
          first
        >
          <FloatingMenuItem.Text>Add a </FloatingMenuItem.Text>
          <FloatingMenuItem.Text color={colors.accent}>meta stat</FloatingMenuItem.Text>
        </FloatingMenuItem>
        <FloatingMenuItem
          description='Want to keep track of something?'
          onPress={() => {
            trackerTypeSheetRef.current?.present()
            hidePopover()
          }}
        >
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
          last
        >
          <FloatingMenuItem.Text>Add a </FloatingMenuItem.Text>
          <FloatingMenuItem.Text color={colors.accent}>goal</FloatingMenuItem.Text>
        </FloatingMenuItem>
        {/*<FloatingMenuItem description='Made some progress?' onPress={() => null}>*/}
        {/*  <FloatingMenuItem.Text>Add </FloatingMenuItem.Text>*/}
        {/*  <FloatingMenuItem.Text color={colors.accent}>updates</FloatingMenuItem.Text>*/}
        {/*</FloatingMenuItem>*/}
      </Popover>

      <NewGoalModal
        hideModal={hideNewGoalModal}
        modalProps={newGoalModalProps}
        isLongTerm={newGoalType === 'longterm'}
      />

      <SheetModalSelect
        ref={trackerTypeSheetRef}
        title='Tracker type'
        options={[
          { value: 'stat', label: 'Stat tracker', description: 'Track some value over time' },
          { value: 'date', label: 'Date tracker', description: 'Track time until some date' },
        ]}
        onSelect={(value) => router.navigate({ pathname: '/tracker/add', params: { type: value } })}
      />
    </>
  )
}
