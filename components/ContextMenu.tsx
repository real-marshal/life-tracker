import { Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { Pressable } from 'react-native-gesture-handler'

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
  color = colors.fg,
  iconName,
  iconSize = 18,
}: {
  label: string
  onPress?: () => void
  last?: boolean
  color?: string
  iconName?: keyof (typeof Feather)['glyphMap']
  iconSize?: number
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        className={`flex flex-row gap-5 px-5 py-3 ${last ? 'rounded-b-lg' : 'border-b-hairline'} border-bgTertiary items-center active:bg-bgTertiary`}
      >
        <Text className='text-lg grow' style={{ color: color }}>
          {label}
        </Text>
        <Feather name={iconName} size={iconSize} color={color} />
      </View>
    </Pressable>
  )
}
