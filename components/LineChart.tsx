import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  CartesianChart,
  ChartBounds,
  ChartPressState,
  PointsArray,
  useChartPressState,
  useChartTransformState,
  useLinePath,
} from 'victory-native'
import { colors } from '@/common/theme'
import {
  Circle,
  DashPathEffect,
  Group,
  Path,
  Points,
  useFont,
  vec,
  Text as SkText,
  RoundedRect,
  Matrix4,
} from '@shopify/react-native-skia'
import {
  addMonths,
  addWeeks,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns'
import hairlineWidth = StyleSheet.hairlineWidth
import { runOnJS, useDerivedValue } from 'react-native-reanimated'
import { clampWorklet } from '@/common/utils/worklet'
import { useMemo, useState } from 'react'
import { doesWeekStartWithMonday } from '@/common/utils/date'
import { ChartTransformState } from '@/node_modules/victory-native/src/cartesian/hooks/useChartTransformState'

const fontAsset = require('@/assets/fonts/SpaceMono-Regular.ttf')

const dateRanges = ['1M', '3M', '6M', '1Y', '2Y', 'ALL'] as const

export type DateRange = (typeof dateRanges)[number]

const dateRangeDetailsMap: Record<
  DateRange,
  {
    label: string
    getRangeTimestamps?: (data: LineChartData[]) => [number, number]
    getTickTimestamps?: (data: LineChartData[]) => number[]
  }
> = {
  '1M': {
    label: '1M',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(lastDate).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateWeekStart = startOfWeek(firstDate, {
        weekStartsOn: doesWeekStartWithMonday() ? 1 : 0,
      })

      const tickTimestamps: number[] = []

      let currentDateWeekStart = firstDateWeekStart
      while (currentDateWeekStart <= addWeeks(lastDate, 1)) {
        tickTimestamps.push(currentDateWeekStart.getTime())

        currentDateWeekStart = addWeeks(currentDateWeekStart, 1)
      }

      return tickTimestamps
    },
  },
  '3M': {
    label: '3M',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subMonths(lastDate, 3)).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateWeekStart = startOfWeek(firstDate, {
        weekStartsOn: doesWeekStartWithMonday() ? 1 : 0,
      })

      const tickTimestamps: number[] = []

      let currentDateWeekStart = firstDateWeekStart
      while (currentDateWeekStart <= addWeeks(lastDate, 1)) {
        tickTimestamps.push(currentDateWeekStart.getTime())

        currentDateWeekStart = addWeeks(currentDateWeekStart, 2)
      }

      return tickTimestamps
    },
  },
  '6M': {
    label: '6M',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subMonths(lastDate, 6)).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateMonthStart = startOfMonth(firstDate)

      const tickTimestamps: number[] = []

      let currentDateMonthStart = firstDateMonthStart
      while (currentDateMonthStart <= addMonths(lastDate, 1)) {
        tickTimestamps.push(currentDateMonthStart.getTime())

        currentDateMonthStart = addMonths(currentDateMonthStart, 1)
      }

      return tickTimestamps
    },
  },
  '1Y': {
    label: '1Y',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subYears(lastDate, 1)).getTime(), lastDate.getTime()]
    },
  },
  '2Y': {
    label: '2Y',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subYears(lastDate, 2)).getTime(), lastDate.getTime()]
    },
  },
  ALL: {
    label: 'ALL',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      return [new Date(data[0].date).getTime(), new Date(data.at(-1)!.date).getTime()]
    },
  },
}

// don't pass x as date objects until this is resolved
// https://github.com/FormidableLabs/victory-native-xl/issues/591
export interface LineChartData {
  date: string
  [K: string]: any
}

type LineChartDataNumber = Omit<LineChartData, 'date'> & { date: number }

// regarding grid animation lag
// https://github.com/FormidableLabs/victory-native-xl/issues/538
export function LineChart({
  data: passedData,
  x,
  y,
}: {
  data: LineChartData[]
  x: string
  y: string
}) {
  const { state: transformState } = useChartTransformState()
  const { state: pressState, isActive } = useChartPressState({ x: 0, y: { [y]: 0 } })

  const font = useFont(fontAsset, 11)
  const [dateRange, setDateRange] = useState<DateRange>('1M')

  const data = useMemo(() => {
    return passedData.map(
      (datum) =>
        ({
          ...datum,
          date: new Date(datum.date).getTime(),
        }) as LineChartDataNumber
    )
  }, [passedData])

  const tickTimestamps = dateRangeDetailsMap[dateRange]?.getTickTimestamps?.(passedData)

  console.log(tickTimestamps?.map((t) => new Date(t).toISOString()))

  return (
    <View className='h-[300] flex flex-col gap-2'>
      <CartesianChart
        data={data}
        xKey={x}
        yKeys={[y]}
        xAxis={{
          font,
          labelColor: colors.fgSecondary,
          lineColor: colors.fgSecondary,
          linePathEffect: <DashPathEffect intervals={[3, 3]} />,
          formatXLabel: (date) =>
            typeof date === 'number' ? format(new Date(date), 'LLL d') : date?.toString(),
          tickCount: tickTimestamps?.length,
          tickValues: tickTimestamps,
        }}
        yAxis={[
          {
            font,
            labelColor: colors.fgSecondary,
            lineColor: colors.bgTertiary,
          },
        ]}
        frame={{
          lineColor: colors.bgTertiary,
          lineWidth: { left: hairlineWidth, bottom: hairlineWidth, top: 0, right: 0 },
        }}
        transformState={transformState}
        transformConfig={{
          pan: { dimensions: 'x' },
          pinch: { enabled: false },
        }}
        chartPressState={pressState}
        domainPadding={{ top: 10, bottom: 10 }}
        viewport={{ x: dateRangeDetailsMap[dateRange]?.getRangeTimestamps?.(passedData) }}
      >
        {({ points, chartBounds, xScale }) => (
          <InteractiveLine
            points={points[y]}
            isActive={isActive}
            pressState={pressState}
            y={y}
            chartBounds={chartBounds}
            minX={Math.min(xScale.range()[0]!, 0)}
          />
        )}
      </CartesianChart>
      <DateRangeControls
        dateRange={dateRange}
        setDateRange={setDateRange}
        transformState={transformState}
      />
    </View>
  )
}

function InteractiveLine({
  points,
  isActive,
  pressState,
  y,
  chartBounds,
  minX,
  tooltipFontSize = 15,
  tooltipXPadding = 5,
  tooltipYPadding = 2,
  lineWidth = 2,
}: {
  points: PointsArray
  isActive: boolean
  pressState: ChartPressState<any>
  y: string
  chartBounds: ChartBounds
  minX: number
  tooltipFontSize?: number
  tooltipXPadding?: number
  tooltipYPadding?: number
  lineWidth?: number
}) {
  const tooltipHeight = tooltipFontSize + tooltipYPadding * 2

  const font = useFont(fontAsset, tooltipFontSize)

  const animatedLine = useDerivedValue(() => {
    const x = clampWorklet(
      pressState.x.position.value,
      minX + lineWidth / 2,
      chartBounds.right - lineWidth / 2
    )

    const startPoint = vec(x, chartBounds.top)
    const endPoint = vec(x, chartBounds.bottom)

    return [startPoint, endPoint]
  })

  const text = useDerivedValue(() => {
    return pressState.y[y].value.value.toString()
  })

  const textWidth = useDerivedValue(() => {
    return (
      font?.getGlyphWidths(font.getGlyphIDs(text.value)).reduce((sum, value) => sum + value, 0) ?? 0
    )
  })

  const textX = useDerivedValue(() => {
    const x = pressState.x.position.value
    const shift = textWidth.value / 2

    return clampWorklet(x, minX + lineWidth / 2 + shift, chartBounds.right - shift) - shift
  })

  const tooltipWidth = useDerivedValue(() => {
    return textWidth.value + tooltipXPadding * 2
  })

  const tooltipX = useDerivedValue(() => {
    return textX.value - tooltipXPadding
  })

  return (
    <>
      <LineWithCircles points={points} />
      {isActive ? (
        <Group>
          <Points
            points={animatedLine}
            color={colors.bgTertiary}
            mode='polygon'
            style='stroke'
            strokeWidth={lineWidth}
          />
          <Circle
            cx={pressState.x.position}
            cy={pressState.y[y].position}
            r={5}
            color={colors.accent}
          />
          <RoundedRect
            x={tooltipX}
            y={0}
            width={tooltipWidth}
            height={tooltipHeight}
            color={colors.bgTertiary}
            // radius prop is marked as optional, yet if you don't pass it, the app crashes with this error
            // ReanimatedError: Exception in HostFunction: Invalid properties for rounded rect, js engine: reanimated
            r={5}
          />
          <SkText x={textX} y={tooltipFontSize} text={text} font={font} color={colors.fg} />
        </Group>
      ) : null}
    </>
  )
}

function LineWithCircles({ points }: { points: PointsArray }) {
  const { path } = useLinePath(points, { curveType: 'linear' /*connectMissingData: true */ })

  return (
    <Group>
      <Path path={path} style='stroke' color={colors.accent} strokeWidth={2} />
      {points.map((point, index) => (
        <Group key={index}>
          <Circle cx={point.x} cy={point.y ?? 0} r={4} color={colors.bgSecondary} />
          <Circle
            cx={point.x}
            cy={point.y ?? 0}
            r={4}
            color={colors.accent}
            style='stroke'
            strokeWidth={2}
          />
        </Group>
      ))}
    </Group>
  )
}

function DateRangeControls({
  dateRange: currentDateRange,
  setDateRange,
  transformState,
}: {
  dateRange: DateRange
  setDateRange: (dateRange: DateRange) => void
  transformState: ChartTransformState
}) {
  return (
    <View className='flex flex-row gap-6 self-center'>
      {dateRanges.map((dateRange, ind) => (
        <Pressable
          key={ind}
          onPress={() => {
            setDateRange(dateRange)

            const matrix = [...transformState.matrix.value]
            matrix[3] = 0

            transformState.matrix.value = matrix as unknown as Matrix4
          }}
        >
          <Text
            className={`font-bold px-1 text-lg ${currentDateRange === dateRange ? 'text-fg border-b-2 border-fg' : 'text-fgSecondary'}`}
          >
            {dateRangeDetailsMap[dateRange].label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
