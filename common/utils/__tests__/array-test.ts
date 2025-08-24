import { sortWithIndex } from '../array'

describe('sortWithIndex', () => {
  it('should place items with matching index at their specified position', () => {
    const input = [
      { id: 'a', renderData: { index: 2 } },
      { id: 'b', renderData: { index: 0 } },
      { id: 'c', renderData: { index: 1 } },
    ]
    const expectedResult = [
      { id: 'b', renderData: { index: 0 } },
      { id: 'c', renderData: { index: 1 } },
      { id: 'a', renderData: { index: 2 } },
    ]

    const result = sortWithIndex(input)

    expect(result).toEqual(expectedResult)
  })

  it('should place items without index in first available slots', () => {
    const input = [
      { id: 'a' },
      { id: 'b', renderData: { index: 2 } },
      { id: 'c' },
      { id: 'd', renderData: {} },
    ]
    const expectedResult = [
      { id: 'a' },
      { id: 'c' },
      { id: 'b', renderData: { index: 2 } },
      { id: 'd', renderData: {} },
    ]

    const result = sortWithIndex(input)

    expect(result).toEqual(expectedResult)
  })

  it('should handle mixed scenarios with gaps', () => {
    const input = [
      { id: 'a', renderData: { index: 0 } },
      { id: 'b' },
      { id: 'c', renderData: { index: 3 } },
      { id: 'd' },
    ]
    const expectedResult = [
      { id: 'a', renderData: { index: 0 } },
      { id: 'b' },
      { id: 'd' },
      { id: 'c', renderData: { index: 3 } },
    ]

    const result = sortWithIndex(input)

    expect(result).toEqual(expectedResult)
  })

  it('should handle empty array', () => {
    const result = sortWithIndex([])
    expect(result).toEqual([])
  })

  it('should handle all items without indices', () => {
    const input = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

    const result = sortWithIndex(input)
    expect(result).toEqual(input)
  })
})
