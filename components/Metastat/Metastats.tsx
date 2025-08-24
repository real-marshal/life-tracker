import { SortableGridRenderItem } from 'react-native-sortables'
import { useCallback } from 'react'
import { MetaStat, updateMetaStatIndices } from '@/models/metastat'
import { MetastatItem } from '@/components/Metastat/MetastatItem'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { SortableList } from '@/components/SortableList'

export function Metastats({ metastats }: { metastats: MetaStat[] }) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { mutate: updateMetaStatIndexMutator, error: updatingError } = useMutation({
    mutationFn: (param: { id: number; index: number }[]) => updateMetaStatIndices(db, param),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metastats'] }),
  })

  useErrorToasts({ title: 'Error updating meta stat index', errorData: updatingError })

  return (
    <SortableList
      data={metastats}
      renderItem={useCallback<SortableGridRenderItem<MetaStat>>(
        ({ item }) => (
          <MetastatItem {...item} key={item.id} />
        ),
        []
      )}
      updateIndexes={updateMetaStatIndexMutator}
      rowGap={4}
    />
  )
}
