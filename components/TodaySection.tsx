import { Text } from 'react-native'
import { useEffect, useRef, useState } from 'react'

const getDate = () =>
  new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

export function TodaySection() {
  const [date, setDate] = useState(getDate())
  const interval = useRef<number | null>(null)

  useEffect(() => {
    interval.current = setInterval(() => setDate(getDate()), 1000)

    return () => {
      interval.current && clearInterval(interval.current)
    }
  }, [])

  return <Text className='text-fg text-2xl font-light'>Today is {date}</Text>
}
