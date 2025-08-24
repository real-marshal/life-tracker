import Sortable from 'react-native-sortables'
import { Pressable } from 'react-native'
import { ReactNode } from 'react'

export function PressableWrapper({
  onPress,
  className,
  draggable,
  children,
}: {
  onPress?: () => void
  className: string
  draggable?: boolean
  children: ReactNode
}) {
  return draggable ? (
    <Sortable.Touchable onTap={onPress} className={className}>
      {children}
    </Sortable.Touchable>
  ) : (
    <Pressable onPress={onPress} className={className}>
      {children}
    </Pressable>
  )
}
