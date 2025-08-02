import { useEffect, useState } from 'react'

export function useLoader<T extends (...args: any[]) => Promise<any>>(
  load: T,
  ...args: Parameters<T>
) {
  const [data, setData] = useState<Awaited<ReturnType<T>> | null>(null)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    load(...args)
      .then((r) => setData(r))
      .catch((e) => setError(e))
      .then(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...args, load])

  return [data, isLoading, error] as const
}
