import Sortable from 'react-native-sortables'
import { performContextMenuHaptics } from '@/common/utils/haptics'
import { SortableGridRenderItem } from 'react-native-sortables/dist/typescript/types/props/grid'

export function SortableList<T extends { id: number }>({
  data,
  renderItem,
  updateIndexes,
}: {
  data: T[] | undefined
  renderItem: SortableGridRenderItem<T>
  updateIndexes: (updates: { id: number; index: number }[]) => void
}) {
  return (
    <Sortable.Grid
      data={data ?? []}
      renderItem={renderItem}
      overDrag='none'
      activeItemScale={1}
      onDragStart={performContextMenuHaptics}
      onDragEnd={({ fromIndex, toIndex }) => {
        if (!data) return

        const updates = [{ id: data[fromIndex].id, index: toIndex }]

        if (fromIndex > toIndex) {
          for (let i = toIndex; i < fromIndex; i++) {
            updates.push({ id: data[i].id, index: i + 1 })
          }
        } else {
          for (let i = fromIndex + 1; i <= toIndex; i++) {
            updates.push({ id: data[i].id, index: i - 1 })
          }
        }

        updateIndexes(updates)
      }}
    />
  )
}
