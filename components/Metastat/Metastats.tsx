import Sortable, { SortableGridRenderItem } from 'react-native-sortables'
import { useCallback } from 'react'
import { MetaStat, updateMetaStatIndices } from '@/models/metastat'
import { MetastatItem } from '@/components/Metastat/MetastatItem'
import { performContextMenuHaptics } from '@/common/utils/haptics'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'

export function Metastats({ metastats }: { metastats: MetaStat[] }) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { mutate: updateMetaStatIndexMutator, error: updatingError } = useMutation({
    mutationFn: (param: { id: number; index: number }[]) => updateMetaStatIndices(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metastats'] }),
  })

  useErrorToasts({ title: 'Error updating meta stat index', errorData: updatingError })

  return (
    <Sortable.Grid
      data={metastats ?? []}
      renderItem={useCallback<SortableGridRenderItem<MetaStat>>(
        ({ item }) => (
          <MetastatItem {...item} key={item.id} />
        ),
        []
      )}
      rowGap={4}
      overDrag='none'
      activeItemScale={1}
      onDragStart={performContextMenuHaptics}
      onDragEnd={({ fromIndex, toIndex }) => {
        const updates = [{ id: metastats[fromIndex].id, index: toIndex }]

        if (fromIndex > toIndex) {
          for (let i = toIndex; i < fromIndex; i++) {
            updates.push({ id: metastats[i].id, index: i + 1 })
          }
        } else {
          for (let i = fromIndex + 1; i <= toIndex; i++) {
            updates.push({ id: metastats[i].id, index: i - 1 })
          }
        }

        updateMetaStatIndexMutator(updates)
      }}
    />
  )
}
