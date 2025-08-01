export function toCamelCase<T extends Record<string, any>>(obj: Record<string, T[keyof T]>): T {
  const converted: Partial<T> = {}

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) as keyof T

    converted[camelKey] = value
  }

  return converted as T
}
