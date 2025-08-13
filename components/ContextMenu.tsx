import { Text, View, Pressable as RNPressable } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { Pressable } from 'react-native-gesture-handler'
import { cn } from '@/common/utils/css'

export function ContextMenuSection({ label, first }: { label: string; first?: boolean }) {
  return (
    <Text
      className={`text-fg uppercase text-[10px] font-medium bg-bgTertiary px-3 py-1 ${first ? 'rounded-t-lg' : ''}`}
    >
      {label}
    </Text>
  )
}

export function ContextMenuItem({
  label,
  onPress,
  last,
  color: passedColor,
  iconName,
  iconSize = 18,
  rnPressable,
}: {
  label: string
  onPress?: () => void
  last?: boolean
  color?: string
  iconName?: keyof (typeof Feather)['glyphMap']
  iconSize?: number
  rnPressable?: boolean
}) {
  const PressableComponent = rnPressable ? RNPressable : Pressable

  const iconColor = passedColor ?? colors.fgSecondary
  const color = passedColor ?? colors.fg

  return (
    <PressableComponent onPress={onPress}>
      {({ pressed }) => (
        <View
          className={cn('flex flex-row gap-8 px-5 py-3 border-bgTertiary items-center', {
            'bg-bgTertiary': pressed,
            'rounded-b-lg': last,
            'border-b-hairline': !last,
          })}
        >
          <Text className='text-lg grow' style={{ color: color }}>
            {label}
          </Text>
          <Feather name={iconName} size={iconSize} color={iconColor} />
        </View>
      )}
    </PressableComponent>
  )
}
