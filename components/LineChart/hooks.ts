import { useEffect, useState } from 'react'
import { DateRange, dateRangeDetailsMap, dateRanges } from '@/components/LineChart/dateRanges'
import { LineChartData } from './LineChart'
import { SharedValue, useAnimatedReaction } from 'react-native-reanimated'
import { Matrix4 } from '@shopify/react-native-skia'
import { ChartTransformState } from '@/node_modules/victory-native/src/cartesian/hooks/useChartTransformState'

export function useLineChartExtraData(data: LineChartData[]) {
  const [tickTimestamps, setTickTimestamps] = useState(
    dateRanges.reduce(
      (result, dateRange) => ({ ...result, [dateRange]: [] }),
      {} as Record<DateRange, number[]>
    )
  )
  const [rangeTimestamps, setRangeTimestamps] = useState(
    dateRanges.reduce(
      (result, dateRange) => ({ ...result, [dateRange]: [] }),
      {} as Record<DateRange, [number, number]>
    )
  )

  useEffect(() => {
    dateRanges.forEach((dateRange) => {
      setTickTimestamps((tickTimestamps) => ({
        ...tickTimestamps,
        [dateRange]: dateRangeDetailsMap[dateRange].getTickTimestamps?.(data),
      }))
      setRangeTimestamps((rangeTimestamps) => ({
        ...rangeTimestamps,
        [dateRange]: dateRangeDetailsMap[dateRange].getRangeTimestamps(data),
      }))
    })
  }, [data])

  return { tickTimestamps, rangeTimestamps } as const
}

export function useEnforceLineChartScrollBounds({
  transformState,
  minX,
  padding = 0,
}: {
  transformState: ChartTransformState
  minX: SharedValue<number>
  padding?: number
}) {
  useAnimatedReaction(
    () => transformState.matrix.value[3],
    (prepared, previous) => {
      // very peculiar case - even though implementations below appear equivalent to me,
      // on the initial mount, the commented version performs an incorrect shift...
      // if (
      //   prepared === previous ||
      //   (transformState.matrix.value[3] >= -25 && transformState.matrix.value[3] <= -minX.value)
      // )
      //   return
      //
      // const matrix = [...transformState.matrix.value]
      // matrix[3] = clampWorklet(transformState.matrix.value[3], -25, -minX.value)
      // transformState.matrix.value = matrix as unknown as Matrix4
      if (prepared !== previous) {
        if (transformState.matrix.value[3] < -padding) {
          const matrix = [...transformState.matrix.value]
          matrix[3] = -padding
          transformState.matrix.value = matrix as unknown as Matrix4
        } else if (transformState.matrix.value[3] > -minX.value) {
          const matrix = [...transformState.matrix.value]
          matrix[3] = -minX.value + padding
          transformState.matrix.value = matrix as unknown as Matrix4
        }
      }
    }
  )
}
