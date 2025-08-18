import { useEffect } from 'react'

export function useDebugMounts(label?: string) {
  useEffect(() => {
    console.log(`Mounted: ${label}`)

    return () => {
      console.log(`Unmounted: ${label}`)
    }
  }, [label])
}
