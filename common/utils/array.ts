//  O(n) btw
export function sortWithIndex<
  T extends { [key: string]: unknown; renderData?: { index?: number } },
>(sortedArr: T[]) {
  const length = sortedArr.length

  if (sortedArr.length === 0) {
    return []
  }

  const result: (T | undefined)[] = Array.from({ length })
  const isSlotTaken = Array.from({ length }, () => false)

  sortedArr.forEach((item) => {
    const index = item.renderData?.index

    if (typeof index === 'number' && index >= 0 && index < length) {
      result[index] = item
      isSlotTaken[index] = true
    }
  })

  let slotIndex = 0
  sortedArr.forEach((item) => {
    const index = item.renderData?.index

    if (typeof index !== 'number' || index < 0 || index >= length) {
      while (isSlotTaken[slotIndex]) {
        slotIndex++
      }

      result[slotIndex] = item
      slotIndex++
    }
  })

  return result as T[]
}
