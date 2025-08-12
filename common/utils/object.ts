import { isEqualWith, isObject } from 'lodash'
import { DateTz } from '@/common/utils/date'
import { replaceEqualDeep } from '@tanstack/react-query'

export function toCamelCase<T extends Record<string, any>>(obj: Record<string, T[keyof T]>): T {
  const converted: Partial<T> = {}

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) as keyof T

    converted[camelKey] = value
  }

  return converted as T
}

export function structuralSharingWithDateTz(oldData: unknown, newData: unknown) {
  const areEqual = isEqualWith(oldData, newData, (a, b) => {
    if (
      isObject(a) &&
      ((a as DateTz).date as unknown) instanceof Date &&
      (a as DateTz).tz &&
      isObject(b) &&
      ((b as DateTz).date as unknown) instanceof Date &&
      (b as DateTz).tz
    ) {
      return (
        (a as DateTz).date.toISOString() === (b as DateTz).date.toISOString() &&
        (a as DateTz).tz === (b as DateTz).tz
      )
    }
  })

  return areEqual ? oldData : replaceEqualDeep(oldData, newData)
}
