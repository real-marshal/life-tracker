import { getDecayValue } from '@/components/Metastat/common'

jest.useFakeTimers()

describe('getDecayValue', () => {
  it('should return undefined for new metastat where lastValueIncreaseDate equals lastDecayDate', () => {
    const today = new Date('2025-07-19T21:47:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-19T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-19T21:46:00.000Z'),
    })

    expect(result).toBeUndefined()
  })

  it('should return undefined when some updates happened with no decays yet', () => {
    const today = new Date('2025-07-21T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-20T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-19T21:46:00.000Z'),
    })

    expect(result).toBeUndefined()
  })

  it('should return undefined when a decay almost happened with no updates yet', () => {
    const today = new Date('2025-07-26T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-19T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-19T21:46:00.000Z'),
    })

    expect(result).toBeUndefined()
  })

  it('should return 1/32 when a decay happened with no updates yet', () => {
    const today = new Date('2025-07-27T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-19T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-19T21:46:00.000Z'),
    })

    expect(result).toBe(1 / 32)
  })

  it('should return 1/32 * 3 when a decay happened with no updates yet after days of inactivity', () => {
    const today = new Date('2025-07-29T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-19T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-19T21:46:00.000Z'),
    })

    expect(result).toBe((1 / 32) * 3)
  })

  it('should return 1/32 when a decay happened with some updates before', () => {
    const today = new Date('2025-07-29T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-21T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-19T21:46:00.000Z'),
    })

    expect(result).toBe(1 / 32)
  })

  it('should return 1/32 * 3 when a decay happened with some updates before after days of inactivity', () => {
    const today = new Date('2025-07-31T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-21T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-19T21:46:00.000Z'),
    })

    expect(result).toBe((1 / 32) * 3)
  })

  it('should return undefined for no decay after a previous decay', () => {
    const today = new Date('2025-07-29T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-29T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-28T21:46:00.000Z'),
    })

    expect(result).toBeUndefined()
  })

  it('should return undefined a bit later when still no decay yet', () => {
    const today = new Date('2025-08-01T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-30T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-28T21:46:00.000Z'),
    })

    expect(result).toBeUndefined()
  })

  it('should return 1/32 for another decay', () => {
    const today = new Date('2025-08-07T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-30T21:46:00.000Z'),
      lastDecayDate: new Date('2025-07-28T21:46:00.000Z'),
    })

    expect(result).toBe(1 / 32)
  })

  it('should return 1/32 for next day decay', () => {
    const today = new Date('2025-08-09T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-30T21:46:00.000Z'),
      lastDecayDate: new Date('2025-08-08T21:46:00.000Z'),
    })

    expect(result).toBe(1 / 32)
  })

  it('should return 1/32 * 3 for decay after multiple days skipped and was already decayed in the past', () => {
    const today = new Date('2025-08-11T21:46:00.000Z')
    jest.setSystemTime(today)

    const result = getDecayValue('moderate', {
      lastValueIncreaseDate: new Date('2025-07-30T21:46:00.000Z'),
      lastDecayDate: new Date('2025-08-08T21:46:00.000Z'),
    })

    expect(result).toBe((1 / 32) * 3)
  })
})
