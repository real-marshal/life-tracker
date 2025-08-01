import { useCallback, useState } from 'react'

export function useMutator<T extends (...args: any[]) => Promise<any>>(mutate: T) {
  const [error, setError] = useState<any>(null)
  const [isDone, setIsDone] = useState<boolean>(false)

  const mutator = useCallback(
    async (...args: Parameters<T>) => {
      setIsDone(false)

      try {
        await mutate(...args)
      } catch (err) {
        setError(err)
      }

      setIsDone(true)
    },
    [mutate]
  )

  return [mutator, isDone, error] as const
}
