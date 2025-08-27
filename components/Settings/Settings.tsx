import { colors } from '@/common/theme'
import { ReactNode } from 'react'
import { Pressable } from 'react-native-gesture-handler'
import { Text, View } from 'react-native'
import { cn } from '@/common/utils/css'

export function SettingsItem({
  text,
  description,
  color = colors.fg,
  onPress,
  first,
  last,
  children,
}: {
  text?: string
  description?: string
  color?: string
  onPress?: () => void
  first?: boolean
  last?: boolean
  children?: ReactNode
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        className={cn(
          'flex flex-col gap-[2] border-bgTertiary py-3 px-4 bg-bgSecondary active:bg-bgTertiary',
          { 'border-t-hairline': !first, 'rounded-b-lg': last, 'rounded-t-lg': first }
        )}
      >
        {text && (
          <Text className='text-lg' style={{ color }}>
            {text}
          </Text>
        )}
        {description && <Text className='text-fgSecondary'>{description}</Text>}
        {children}
      </View>
    </Pressable>
  )
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className='flex flex-col gap-2'>
      <Text className='text-fg uppercase font-light px-2'>{title}</Text>
      <View className='flex flex-col bg-bgSecondary rounded-lg'>{children}</View>
    </View>
  )
}
