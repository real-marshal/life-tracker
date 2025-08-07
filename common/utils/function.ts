// simple memoization function, works only with types that are stringifiable deterministically
// (primitive types mostly, not objects)
export function memoize<T extends any[], R>(f: (...args: T) => R) {
  const cache: Record<string, R> = {}

  return function fn(...args: T): R {
    const key = args.join(',')

    if (!cache[key]) {
      cache[key] = f(...args)
    }

    return cache[key]
  }
}
