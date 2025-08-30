import { Keyboard, Text, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteMetaStat,
  getMetaStats,
  updateMetaStat,
  UpdateMetaStatParam,
} from '@/models/metastat'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { useState } from 'react'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { AnimatedChevron } from '@/components/AnimatedChevron'
import { cn } from '@/common/utils/css'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useModal } from '@/components/Modal'
import { MetastatDetails } from '@/components/Metastat/MetastatDetails'

// noinspection JSUnusedGlobalSymbols
export default function EditMetastatsScreen() {
  const router = useRouter()
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: metastats, error: metaStatsError } = useQuery({
    queryKey: ['metastats'],
    queryFn: () => getMetaStats(db),
  })
  const { mutate: deleteMetaStatMutator, error: deletingError } = useMutation({
    mutationFn: (id: number) => deleteMetaStat(db, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metastats'] }),
  })
  const { mutate: updateMetaStatMutator, error: updatingError } = useMutation({
    mutationFn: (param: UpdateMetaStatParam) => updateMetaStat(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metastats'] }),
  })

  useErrorToasts(
    { title: 'Error loading meta stats', errorData: metaStatsError },
    { title: 'Error deleting metastat', errorData: deletingError },
    { title: 'Error updating metastat', errorData: updatingError }
  )

  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const [itemWidth, setItemWidth] = useState<number>(0)

  const {
    showModal: showDeleteMetastatModal,
    hideModal: hideDeleteMetastatModal,
    ...deleteMetastatModalProps
  } = useModal()

  const [metaStatToDelete, setMetaStatToDelete] = useState<number>()

  return (
    <Pressable onPress={() => Keyboard.dismiss()}>
      <View className='flex flex-col m-safe pt-3 pb-3 px-3 gap-6 min-h-screen'>
        <View className='flex flex-row gap-4 items-center'>
          <Pressable onPress={() => router.back()}>
            <Feather name='chevron-left' size={30} color={colors.fg} />
          </Pressable>
          <Text className='text-fg text-2xl flex-1'>Edit meta stats</Text>
        </View>
        <View className='flex flex-col gap-4'>
          {metastats?.map((metastat) => {
            const isExpanded = expandedItems.includes(metastat.id)

            return (
              <Animated.View key={metastat.id} layout={LinearTransition}>
                <View className='flex flex-row gap-6 items-center justify-between'>
                  <Pressable
                    onPress={() =>
                      setExpandedItems((items) =>
                        items.includes(metastat.id)
                          ? items.filter((i) => i !== metastat.id)
                          : [...items, metastat.id]
                      )
                    }
                    style={{ flex: 1 }}
                  >
                    <View
                      className={cn(
                        'flex flex-row justify-between items-center bg-bgSecondary active:bg-bgTertiary rounded-t-md p-4',
                        {
                          'rounded-b-md': !isExpanded,
                        }
                      )}
                      onLayout={(e) => !itemWidth && setItemWidth(e.nativeEvent.layout.width)}
                    >
                      <Text className='text-fg text-lg'>{metastat.name}</Text>
                      <AnimatedChevron size={24} invert={isExpanded} />
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setMetaStatToDelete(metastat.id)
                      showDeleteMetastatModal()
                    }}
                  >
                    {({ pressed }) => (
                      <Feather
                        name='trash'
                        size={20}
                        color={pressed ? colors.negativeActive : colors.negative}
                      />
                    )}
                  </Pressable>
                </View>
                <MetastatDetails
                  metastat={metastat}
                  width={itemWidth}
                  expanded={isExpanded}
                  updateMetastat={updateMetaStatMutator}
                />
              </Animated.View>
            )
          })}
        </View>
      </View>
      <ConfirmModal
        text='Are you sure you want to delete this meta stat?'
        hideModal={hideDeleteMetastatModal}
        modalProps={deleteMetastatModalProps}
        onConfirm={() => {
          if (!metaStatToDelete) {
            throw new Error('shouldnt of happened')
          }

          deleteMetaStatMutator(metaStatToDelete)
        }}
        deletion
        containerClassName='max-w-[80%]'
      />
    </Pressable>
  )
}
