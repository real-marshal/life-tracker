import Feather from '@expo/vector-icons/Feather'
import { Pressable, Text } from 'react-native'
import { Backdrop } from './Backdrop'
import { useState } from 'react'
import { colors } from '@/common/theme'

export function HelpTooltip({
  size = 16,
  text,
  top,
}: {
  size?: number
  text: string
  top?: boolean
}) {
  const [isShown, setIsShown] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  return (
    <>
      <Pressable
        onPress={() => setIsShown(true)}
        className='relative z-99'
        style={{ elevation: 10 }}
      >
        <Feather name='help-circle' size={size} color={colors.fgSecondary} />
        {isShown && (
          <Text
            className='absolute text-fg w-72 bg-bgTertiary rounded-md px-3 py-2 z-99 border-bgSecondary border-hairline text-sm'
            onLayout={(e) => setTooltipHeight(e.nativeEvent.layout.height)}
            style={{ top: top ? -tooltipHeight - 8 : 24 }}
          >
            {text}
          </Text>
        )}
      </Pressable>
      {isShown && (
        <Backdrop
          onPress={() => setIsShown(false)}
          className='-top-96 -left-96 h-[5000] w-[2000]'
        />
      )}
    </>
  )
}
