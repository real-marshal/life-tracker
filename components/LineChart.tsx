import { StyleSheet, Text, View } from 'react-native'
import {
  CartesianChart,
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
} from '@shopify/react-native-skia'
import { format } from 'date-fns'
import hairlineWidth = StyleSheet.hairlineWidth
import { useDerivedValue } from 'react-native-reanimated'

const fontAsset = require('@/assets/fonts/SpaceMono-Regular.ttf')

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
        {({ points }) => (
          <InteractiveLine points={points[y]} isActive={isActive} pressState={pressState} y={y} />
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

function InteractiveLine({
  points,
  isActive,
  pressState,
  y,
}: {
  points: PointsArray
  isActive: boolean
  pressState: ChartPressState<any>
  y: string
}) {
  const font = useFont(fontAsset, 14)

  const animatedLine = useDerivedValue(() => {
    const startPoint = vec(pressState.x.position.value, 0)
    const endPoint = vec(pressState.x.position.value, 300)

    return [startPoint, endPoint]
  })

  const text = useDerivedValue(() => {
    return pressState.y[y].value.value.toString()
  })

  // TODO: figure out how to get canvas size and char size (instead of 4)
  // then make sure the tooltip doesn't go beyond the canvas
  const textX = useDerivedValue(() => {
    return pressState.x.position.value - text.value.length * 4
  })

  return (
    <>
      <LineWithCircles points={points} />
      {isActive ? (
        <Group>
          <Points
            points={animatedLine}
            color={colors.fgSecondary}
            mode='polygon'
            style='stroke'
            strokeWidth={1}
          />
          <Circle
            cx={pressState.x.position}
            cy={pressState.y[y].position}
            r={4}
            color={colors.accent}
          />
          <SkText x={textX} y={16} text={text} font={font} color={colors.fg} />
        </Group>
      ) : null}
    </>
  )
}
