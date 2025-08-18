import { Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getGoal, getLtGoal, Goal, LtGoal } from '@/models/goal'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { colors, goalStatusActiveColorMap, goalStatusColorMap } from '@/common/theme'
import Feather from '@expo/vector-icons/Feather'
import { formatDateSmart, makeDateTz } from '@/common/utils/date'
import {
  addGoalUpdate,
  deleteGoalUpdate,
  getGoalUpdates,
  GoalUpdate,
  updateGoalUpdate,
  UpdateGoalUpdateParam,
} from '@/models/goalUpdate'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FloatingButton, FloatingMenuItem } from '@/components/FloatingMenu'
import { Popover } from '@/components/Popover'
import { useFloatingMenu } from '@/hooks/useFloatingMenu'
import { Pressable } from 'react-native-gesture-handler'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useModal } from '@/components/Modal'
import { GoalUpdateRecordWrapper } from '@/components/Goal/GoalUpdateRecord'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ContextMenuItem, ContextMenuSection } from '@/components/ContextMenu'
import { Backdrop } from '@/components/Backdrop'
import { NEW_ID } from '@/components/Goal/constants'
import { GoalDetails } from '@/components/Goal/GoalDetails'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { GoalSheet } from '@/components/Goal/GoalSheet'
import { useSheetBackHandler } from '@/hooks/useSheetBackHandler'
import { SheetBackdrop } from '@/components/SheetBackdrop'

interface GoalUpdateModificationState {
  id: number
  editable?: boolean
  modification?:
    | { type: 'delete' }
    | { type: 'create'; content: string }
    | { type: 'update'; newContent: string }
}

export default function GoalScreen() {
  const { id: idString, type } = useLocalSearchParams()
  const db = useSQLiteContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const id = Number.parseInt(idString as string)
  const isLongTerm = type === 'longterm'

  const { data: goal, error: goalError } = useQuery<LtGoal | Goal>({
    queryKey: ['goal', id],
    queryFn: () => (isLongTerm ? getLtGoal(db, id) : getGoal(db, id)),
  })
  const { data: goalUpdatesStored, error: goalUpdatesError } = useQuery({
    queryKey: ['goalUpdates', id],
    queryFn: () => getGoalUpdates(db, id),
    // when the goal updates are cached, react thread gets stuck trying to render all those components,
    // creating a long animation delay. but if they are not cached, the first render is much simpler,
    // removing it, while the list is rendered during the animation itself
    // we are kinda decreasing our TTL here
    // structuralSharing: structuralSharingWithDateTz,
    gcTime: 0,
  })
  const { mutate: addGoalUpdateMutator, error: goalUpdateAddingError } = useMutation({
    mutationFn: (goalUpdate: GoalUpdate) => addGoalUpdate(db, id, goalUpdate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goalUpdates'] }),
  })
  const { mutate: updateGoalUpdateMutator, error: goalUpdateUpdatingError } = useMutation({
    mutationFn: (param: UpdateGoalUpdateParam) => updateGoalUpdate(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goalUpdates'] }),
  })
  const { mutate: deleteGoalUpdateMutator, error: goalUpdateDeletingError } = useMutation({
    mutationFn: (id: number) => deleteGoalUpdate(db, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goalUpdates'] }),
  })

  useErrorToasts(
    { title: 'Error loading a goal', errorData: goalError },
    { title: 'Error loading goal updates', errorData: goalUpdatesError },
    { title: 'Error adding a goal update', errorData: goalUpdateAddingError },
    { title: 'Error updating a goal update', errorData: goalUpdateUpdatingError },
    { title: 'Error deleting a goal update', errorData: goalUpdateDeletingError }
  )

  const [goalUpdates, setGoalUpdates] = useState(goalUpdatesStored)

  useEffect(() => {
    setGoalUpdates(goalUpdatesStored)
  }, [goalUpdatesStored])

  const goalUpdatesByDate = useMemo(
    () =>
      goalUpdates?.reduce(
        (result, goalUpdate) => {
          const date = goalUpdate.createdAt.date.toDateString()

          result[date] ??= []
          result[date].push(goalUpdate)

          return result
        },
        {} as Record<string, GoalUpdate[]>
      ) ?? {},
    [goalUpdates]
  )

  const [goalUpdateModificationState, setGoalUpdateModificationState] =
    useState<GoalUpdateModificationState>()

  const [goalUpdateContextMenuPosition, setGoalUpdateContextMenuPosition] = useState(0)

  const onContextMenuCancelRef = useRef<() => void>(() => null)
  const onModalCancelRef = useRef<() => void>(() => null)

  const {
    isPopoverShown: isFloatingMenuShown,
    hidePopover: hideFloatingMenu,
    showPopover: showFloatingMenu,
    animatedStyle: floatingMenuStyle,
  } = useFloatingMenu()

  const {
    isPopoverShown: isMenuShown,
    hidePopover: hideMenu,
    showPopover: showMenu,
    animatedStyle: menuStyle,
  } = useContextMenu()

  const {
    isPopoverShown: isContextMenuShown,
    hidePopover: hideContextMenu,
    showPopover: showContextMenu,
    animatedStyle: contextMenuStyle,
  } = useContextMenu()

  const {
    showModal: showSaveNewModal,
    hideModal: hideSaveNewModal,
    ...saveNewModalProps
  } = useModal(() =>
    setGoalUpdates((goalUpdates) => {
      setGoalUpdateModificationState(undefined)
      return goalUpdates?.filter((goalUpdate) => goalUpdate.id !== NEW_ID)
    })
  )
  const {
    showModal: showDeleteModal,
    hideModal: hideDeleteModal,
    ...deleteModalProps
  } = useModal(() => {
    setGoalUpdateModificationState(undefined)
    onModalCancelRef.current()
  })
  const {
    showModal: showUpdateModal,
    hideModal: hideUpdateModal,
    ...updateModalProps
  } = useModal(() => {
    setGoalUpdateModificationState(undefined)
    onModalCancelRef.current()
  })

  const onAddGoalUpdate = (sentiment: GoalUpdate['sentiment']) => {
    hideFloatingMenu()

    setGoalUpdates((goalUpdates) => [
      {
        id: NEW_ID,
        content: '',
        createdAt: makeDateTz(new Date().toISOString()),
        sentiment,
        type: 'normal',
        isPinned: false,
      },
      ...(goalUpdates ?? []),
    ])
    setGoalUpdateModificationState({
      id: NEW_ID,
      editable: true,
      modification: { type: 'create', content: '' },
    })
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  const onSheetChange = useSheetBackHandler(bottomSheetModalRef)

  const accentColor =
    goal?.status && goal.status !== 'active'
      ? goalStatusColorMap[goal.status]
      : isLongTerm
        ? colors.ltGoal
        : colors.currentGoal

  const accentColorActive =
    goal?.status && goal.status !== 'active'
      ? goalStatusActiveColorMap[goal.status]
      : isLongTerm
        ? colors.ltGoalActive
        : colors.currentGoalActive

  return (
    <>
      <KeyboardAwareScrollView bottomOffset={10} stickyHeaderIndices={[0]}>
        <View className='flex flex-row gap-2 items-center justify-between pt-safe-offset-3 pb-3 px-3 bg-bg'>
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
          <Pressable onPress={showMenu}>
            {({ pressed }) => (
              <Feather
                name='more-horizontal'
                size={24}
                color={pressed ? accentColorActive : accentColor}
              />
            )}
          </Pressable>
        </View>
        <View className='mb-safe mx-safe px-3 pb-5 pt-3 flex flex-col gap-6 min-h-screen'>
          <GoalDetails goal={goal} isLongTerm={isLongTerm} accentColor={accentColor} />
          <View className='flex flex-col gap-4'>
            {useMemo(
              () =>
                Object.values(goalUpdatesByDate).map((dateGoalUpdates) => {
                  const date = formatDateSmart(dateGoalUpdates[0].createdAt)

                  return (
                    <View key={date} className='flex flex-col gap-2'>
                      <Text className='text-fgSecondary text-center font-light border-b-hairline border-fgSecondary pb-[1] text-lg'>
                        {date}
                      </Text>
                      <View className='flex flex-col gap-3'>
                        {dateGoalUpdates.map(({ id, ...goalUpdate }) => (
                          <GoalUpdateRecordWrapper
                            {...goalUpdate}
                            key={id}
                            id={id}
                            editable={
                              id === goalUpdateModificationState?.id &&
                              goalUpdateModificationState?.editable
                            }
                            setGoalUpdateModificationState={setGoalUpdateModificationState}
                            setGoalUpdateContextMenuPosition={setGoalUpdateContextMenuPosition}
                            onContextMenuCancelRef={onContextMenuCancelRef}
                            showContextMenu={showContextMenu}
                            setGoalUpdates={setGoalUpdates}
                            showSaveNewModal={showSaveNewModal}
                            showUpdateModal={showUpdateModal}
                          />
                        ))}
                      </View>
                    </View>
                  )
                }),
              [
                goalUpdateModificationState?.editable,
                goalUpdateModificationState?.id,
                goalUpdatesByDate,
                showContextMenu,
                showSaveNewModal,
                showUpdateModal,
              ]
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {(isMenuShown || isFloatingMenuShown || isContextMenuShown) && (
        <Backdrop
          onPress={() => {
            hideFloatingMenu()
            hideMenu()
            hideContextMenu()
            onContextMenuCancelRef.current()
            setGoalUpdateModificationState(undefined)
          }}
        />
      )}

      {goal?.status === 'active' && (
        <>
          <FloatingButton
            onPress={() => (isFloatingMenuShown ? hideFloatingMenu() : showFloatingMenu())}
            color={isLongTerm ? colors.ltGoal : colors.currentGoal}
            activeColor={isLongTerm ? colors.ltGoalActive : colors.currentGoalActive}
            active={isFloatingMenuShown}
          />
          <Popover
            isOpen={isFloatingMenuShown}
            className='right-safe-offset-7 bottom-[90px] z-[9999999]'
            animatedStyle={floatingMenuStyle}
          >
            <FloatingMenuItem
              title='Add a negative update'
              description='Obstacles are inevitable'
              onPress={() => onAddGoalUpdate('negative')}
              color={colors.negative}
            />
            <FloatingMenuItem
              title='Add a neutral update'
              description='Just a quick note'
              onPress={() => onAddGoalUpdate('neutral')}
            />
            <FloatingMenuItem
              title='Add a positive update'
              description='One stop closer to success'
              onPress={() => onAddGoalUpdate('positive')}
              color={colors.positive}
            />
          </Popover>
          <Popover
            isOpen={isContextMenuShown}
            className='left-0 z-[9999999]'
            animatedStyle={contextMenuStyle}
            style={{ top: goalUpdateContextMenuPosition }}
          >
            <ContextMenuItem
              label='Edit'
              iconName='edit-3'
              onPress={() => {
                hideContextMenu()
                onContextMenuCancelRef.current()
                setGoalUpdateModificationState((state) => {
                  if (!state) throw new Error('shouldnt have happened - state has to contain id')

                  return {
                    ...state,
                    editable: true,
                  }
                })
              }}
              rnPressable
            />
            <ContextMenuItem
              label='Delete goal update'
              iconName='trash'
              color={colors.negative}
              onPress={() => {
                hideContextMenu()
                onContextMenuCancelRef.current()
                setGoalUpdateModificationState((state) => {
                  if (!state) throw new Error('shouldnt have happened - state has to contain id')

                  return {
                    ...state,
                    modification: { type: 'delete' },
                  }
                })
                showDeleteModal()
              }}
              last
              rnPressable
            />
          </Popover>
          <ConfirmModal
            text='Save this goal update?'
            hideModal={hideSaveNewModal}
            modalProps={saveNewModalProps}
            onConfirm={() => {
              if (goalUpdateModificationState?.modification?.type !== 'create') {
                throw new Error('type is supposed to be set to create')
              }

              addGoalUpdateMutator({
                ...goalUpdates![0],
                content: goalUpdateModificationState.modification.content,
              })
              setGoalUpdateModificationState(undefined)
            }}
          />
          <ConfirmModal
            text='Delete this goal update?'
            hideModal={hideDeleteModal}
            modalProps={deleteModalProps}
            onConfirm={() => {
              if (goalUpdateModificationState?.modification?.type !== 'delete') {
                throw new Error('type is supposed to be set to delete')
              }

              deleteGoalUpdateMutator(goalUpdateModificationState.id)
              setGoalUpdateModificationState(undefined)
            }}
            deletion
          />
          <ConfirmModal
            text='Update this goal update?'
            hideModal={hideUpdateModal}
            modalProps={updateModalProps}
            onConfirm={() => {
              if (goalUpdateModificationState?.modification?.type !== 'update') {
                throw new Error('type is supposed to be set to update')
              }

              updateGoalUpdateMutator({
                id: goalUpdateModificationState.id,
                content: goalUpdateModificationState!.modification.newContent,
              })
              setGoalUpdateModificationState(undefined)
            }}
          />
          <Popover
            isOpen={isMenuShown}
            className='right-safe-offset-7 top-[90px] z-[9999999]'
            animatedStyle={menuStyle}
          >
            <ContextMenuSection label='Change status' first />
            <ContextMenuItem
              label='Abandon'
              iconName='x'
              color={colors.negative}
              onPress={() => {
                hideMenu()
                bottomSheetModalRef.current?.present()
              }}
            />
            <ContextMenuItem
              label='Complete'
              iconName='check'
              color={colors.positive}
              onPress={() => {
                hideMenu()
                bottomSheetModalRef.current?.present()
              }}
            />
            <ContextMenuItem
              label='Delay'
              iconName='clock'
              color={colors.delayedGoal}
              onPress={() => null}
            />
            <ContextMenuSection label='Add a continuation' />
            <ContextMenuItem label='Prerequisite' iconName='arrow-down-left' onPress={() => null} />
            <ContextMenuItem label='Consequence' iconName='arrow-up-right' onPress={() => null} />
          </Popover>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            backgroundStyle={{
              backgroundColor: colors.bgSecondary,
              borderRadius: 40,
            }}
            handleIndicatorStyle={{ backgroundColor: colors.accent, width: 100, height: 3 }}
            keyboardBlurBehavior='restore'
            enableBlurKeyboardOnGesture
            backdropComponent={SheetBackdrop}
            onChange={onSheetChange}
          >
            <GoalSheet id={id} action='abandon' />
          </BottomSheetModal>
        </>
      )}
    </>
  )
}
