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
import hairlineWidth = StyleSheet.hairlineWidth
import { SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { clampWorklet } from '@/common/utils/worklet'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ChartTransformState } from '@/node_modules/victory-native/src/cartesian/hooks/useChartTransformState'
import { DateRange, dateRangeDetailsMap, dateRanges } from '@/components/LineChart/dateRanges'
import { useEnforceLineChartScrollBounds, useRightPadding } from '@/components/LineChart/hooks'
import { memoize } from '@/common/utils/function'

const fontAsset = require('@/assets/fonts/SpaceMono-Regular.ttf')

// don't pass x as date objects until this is resolved
// https://github.com/FormidableLabs/victory-native-xl/issues/591
export interface LineChartData {
  date: string
  [K: string]: any
}

// the only way atm to have correct scaling between dates
// https://github.com/FormidableLabs/victory-native-xl/issues/384
type LineChartDataTimestamps = Omit<LineChartData, 'date'> & { date: number }

function UnmemoedLineChart({
  data: passedData,
  x,
  y,
  rightPadding = 25,
}: {
  data: LineChartData[]
  x: string
  y: string
  rightPadding?: number
}) {
  const { state: transformState } = useChartTransformState()
  const { state: pressState, isActive } = useChartPressState({ x: 0, y: { [y]: 0 } })

  const font = useFont(fontAsset, 11)
  const [dateRange, setDateRange] = useState<DateRange>('1M')

  const data: LineChartDataTimestamps[] = useMemo(() => {
    return passedData.map((datum) => ({
      ...datum,
      date: new Date(datum.date).getTime(),
    }))
  }, [passedData])

  useRightPadding({ transformState, rightPadding })

  const minX = useSharedValue(0)

  useEnforceLineChartScrollBounds({ transformState, minX, padding: rightPadding })

  const memoizedDateRangeFns =
    useRef<
      Record<
        DateRange,
        Pick<(typeof dateRangeDetailsMap)[DateRange], 'getRangeTimestamps' | 'getTickTimestamps'>
      >
    >(null)

  useEffect(() => {
    // lol
    memoizedDateRangeFns.current = {} as typeof memoizedDateRangeFns.current

    dateRanges.forEach(
      (dateRange) =>
        (memoizedDateRangeFns.current![dateRange] = {
          getRangeTimestamps: memoize(dateRangeDetailsMap[dateRange].getRangeTimestamps),
          getTickTimestamps: dateRangeDetailsMap[dateRange].getTickTimestamps
            ? memoize(dateRangeDetailsMap[dateRange].getTickTimestamps)
            : undefined,
        })
    )
  }, [])

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
            typeof date === 'number'
              ? dateRangeDetailsMap[dateRange]?.getLabel(date)
              : date?.toString(),
          tickCount:
            memoizedDateRangeFns.current?.[dateRange]?.getTickTimestamps?.(passedData)?.length ?? 0,
          tickValues: memoizedDateRangeFns.current?.[dateRange]?.getTickTimestamps?.(passedData),
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
        // setting left/right paddings will cause pan to stop working when running out of viewport...
        domainPadding={{ top: 35, bottom: 10 }}
        viewport={{
          x: memoizedDateRangeFns.current?.[dateRange].getRangeTimestamps(passedData) ?? [0, 0],
        }}
      >
        {({ points, chartBounds, xScale }) => (
          <MemoedInteractiveLine
            points={points[y]}
            isActive={isActive}
            pressState={pressState}
            y={y}
            chartBounds={chartBounds}
            minX={Math.min(xScale.range()[0]!, 0)}
            minXSharedValue={minX}
          />
        )}
      </CartesianChart>
      <DateRangeControls
        dateRange={dateRange}
        setDateRange={setDateRange}
        transformState={transformState}
        rightPadding={rightPadding}
      />
    </View>
  )
}

export const LineChart = memo(UnmemoedLineChart)

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
  minXSharedValue,
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
  minXSharedValue: SharedValue<number>
}) {
  const tooltipHeight = tooltipFontSize + tooltipYPadding * 2

  const font = useFont(fontAsset, tooltipFontSize)
  const fontSmall = useFont(fontAsset, tooltipFontSize * 0.6)

  useEffect(() => {
    minXSharedValue.value = minX
  }, [minX, minXSharedValue])

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

  const dateText = useDerivedValue(() => {
    return new Date(pressState.x.value.value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
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
            height={tooltipHeight * 1.9}
            color={colors.bgTertiary}
            // radius prop is marked as optional, yet if you don't pass it, the app crashes with this error
            // ReanimatedError: Exception in HostFunction: Invalid properties for rounded rect, js engine: reanimated
            r={5}
          />
          <SkText x={textX} y={tooltipFontSize + 2} text={text} font={font} color={colors.fg} />
          <SkText
            x={textX}
            y={tooltipFontSize * 2}
            text={dateText}
            font={fontSmall}
            color={colors.fg}
          />
        </Group>
      ) : null}
    </>
  )
}

const MemoedInteractiveLine = memo(InteractiveLine)

function LineWithCircles({ points }: { points: PointsArray }) {
  const { path } = useLinePath(points, { curveType: 'linear' })

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
  rightPadding,
}: {
  dateRange: DateRange
  setDateRange: (dateRange: DateRange) => void
  transformState: ChartTransformState
  rightPadding: number
}) {
  return (
    <View className='flex flex-row gap-6 self-center'>
      {dateRanges.map((dateRange, ind) => (
        <Pressable
          key={ind}
          onPress={() => {
            setDateRange(dateRange)

            // reset pan position
            const matrix = [...transformState.matrix.value]
            matrix[3] = -rightPadding

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
