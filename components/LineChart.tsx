import { StyleSheet, Text, View } from 'react-native'
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
} from '@shopify/react-native-skia'
import { format } from 'date-fns'
import hairlineWidth = StyleSheet.hairlineWidth
import { useDerivedValue } from 'react-native-reanimated'
import { clampWorklet } from '@/common/utils/worklet'

const fontAsset = require('@/assets/fonts/SpaceMono-Regular.ttf')

// don't pass x as date objects until this is resolved
// https://github.com/FormidableLabs/victory-native-xl/issues/591
// regarding grid animation lag
// https://github.com/FormidableLabs/victory-native-xl/issues/538
export function LineChart({ data, x, y }: { data: Record<string, any>[]; x: string; y: string }) {
  const { state: transformState } = useChartTransformState()
  const { state: pressState, isActive } = useChartPressState({ x: 0, y: { [y]: 0 } })

  const font = useFont(fontAsset, 11)

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
          // sometimes this function actually takes an index, wtf...
          formatXLabel: (date) => (typeof date === 'string' ? format(new Date(date), 'd') : date),
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
      >
        {({ points, chartBounds }) => (
          <InteractiveLine
            points={points[y]}
            isActive={isActive}
            pressState={pressState}
            y={y}
            chartBounds={chartBounds}
          />
        )}
      </CartesianChart>
      <View className='flex flex-row gap-6 self-center'>
        <Text className='text-fg font-bold border-b-2 border-fg px-1 text-lg'>1M</Text>
        <Text className='text-fgSecondary font-bold text-lg'>3M</Text>
        <Text className='text-fgSecondary font-bold text-lg'>6M</Text>
        <Text className='text-fgSecondary font-bold text-lg'>1Y</Text>
        <Text className='text-fgSecondary font-bold text-lg'>2Y</Text>
        <Text className='text-fgSecondary font-bold text-lg'>ALL</Text>
      </View>
    </View>
  )
}

function InteractiveLine({
  points,
  isActive,
  pressState,
  y,
  chartBounds,
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
      chartBounds.left + lineWidth / 2,
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

    return clampWorklet(x, chartBounds.left + shift, chartBounds.right - shift) - shift
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
            r={5}
          />
          <SkText x={textX} y={tooltipFontSize} text={text} font={font} color={colors.fg} />
        </Group>
      ) : null}
    </>
  )
}

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
