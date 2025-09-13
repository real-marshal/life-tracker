import { MetaStat, UpdateMetaStatParam } from '@/models/metastat'
import { useEffect, useRef, useState } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { Text, TextInput, View, ViewStyle } from 'react-native'
import { HelpTooltip } from '@/components/HelpTooltip'
import { Checkbox } from 'expo-checkbox'
import { colors } from '@/common/theme'
import { Pressable } from 'react-native-gesture-handler'
import { capitalize } from 'lodash'
import { AppButton } from '@/components/AppButton'
import { SheetModalSelect } from '@/components/SheetModalSelect'
import { cn } from '@/common/utils/css'

export function MetastatDetails({
  metastat,
  width,
  expanded,
  updateMetastat,
}: {
  metastat: MetaStat
  width: number
  expanded: boolean
  updateMetastat: (param: UpdateMetaStatParam) => void
}) {
  const opacity = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    opacity.value = withTiming(expanded ? 1 : 0, { duration: 300 })
  }, [expanded, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    width,
  }))

  if (!expanded) return null

  return (
    <MetastatForm
      metastat={metastat}
      onSave={updateMetastat}
      animatedStyle={animatedStyle}
      revertible
    />
  )
}

export function MetastatForm({
  animatedStyle,
  metastat,
  onSave,
  revertible,
  className,
}: {
  animatedStyle?: ViewStyle
  metastat: Pick<MetaStat, 'id' | 'name' | 'level' | 'autoDecay'>
  onSave: (param: Pick<MetaStat, 'id' | 'name' | 'level' | 'autoDecay'>) => void
  revertible?: boolean
  className?: string
}) {
  const [name, setName] = useState(metastat.name)

  useEffect(() => {
    setName(metastat.name)
  }, [metastat.name])

  const [isCapped, setIsCapped] = useState(metastat.level === null)

  useEffect(() => {
    setIsCapped(metastat.level === null)
  }, [metastat.level])

  const autoDecaySheetRef = useRef<BottomSheetModal>(null)

  const [autoDecay, setAutoDecay] = useState(metastat.autoDecay)

  useEffect(() => {
    setAutoDecay(metastat.autoDecay)
  }, [metastat.autoDecay])

  const [isChanged, setIsChanged] = useState(false)

  useEffect(() => {
    if (
      name !== metastat.name ||
      isCapped !== (metastat.level === null) ||
      autoDecay !== metastat.autoDecay
    ) {
      setIsChanged(true)
    } else {
      setIsChanged(false)
    }
  }, [autoDecay, isCapped, metastat.autoDecay, metastat.level, metastat.name, name])

  return (
    <>
      <Animated.View
        className={cn(`flex flex-col gap-4 px-4 pb-4 pt-2 bg-bgSecondary rounded-b-md`, className)}
        style={animatedStyle}
      >
        <View className='flex flex-col gap-2'>
          <Text className='text-fgSecondary'>Name:</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className='text-fg bg-bgTertiary px-3 rounded-md'
          />
        </View>
        <View className='flex flex-col gap-2'>
          <View className='flex flex-row gap-2 items-center'>
            <Text className='text-fgSecondary'>Capped:</Text>
            <HelpTooltip
              text={`If checked, the meta stat will only have one level. Useful for cases where you want to track something volatile that doesn't just endlessly grow. If it was previously uncapped, all stored levels will be lost!`}
              top
            />
          </View>
          <Checkbox
            value={isCapped}
            onValueChange={setIsCapped}
            color={colors.bgTertiary}
            className='bg-bgTertiary'
            style={{ borderRadius: 6 }}
          />
        </View>
        <View className='flex flex-col gap-2'>
          <View className='flex flex-row gap-2 items-center'>
            <Text className='text-fgSecondary'>Auto decay:</Text>
            <HelpTooltip
              text={`Automatically decreases the meta stat with each passing day if it wasn't increased in some period of time. Nothing in real life stays forever.\nSlow - very subtle decreases after 2 weeks of no changes\nModerate - small decreases after a week of no changes\nFast - decent decreases after 3 days of no changes`}
              top
            />
          </View>
          <Pressable onPress={() => autoDecaySheetRef.current?.present()}>
            <Text className='text-fg px-3 py-3 bg-bgTertiary rounded-md'>
              {capitalize(autoDecay)}
            </Text>
          </Pressable>
        </View>
        {isChanged && (
          <View className='flex flex-row gap-4 justify-end pt-4'>
            {revertible && (
              <AppButton
                text='Revert'
                onPress={() => {
                  setName(metastat.name)
                  setIsCapped(metastat.level === null)
                  setAutoDecay(metastat.autoDecay)
                }}
                color={colors.fg}
                activeColor={colors.fgSecondary}
                className='py-2 px-6'
              />
            )}
            <AppButton
              text='Save'
              onPress={() =>
                onSave({
                  id: metastat.id,
                  name: name.trim(),
                  level: isCapped ? null : (metastat.level ?? 0),
                  autoDecay,
                })
              }
              color={colors.positive}
              activeColor={colors.positiveActive}
              className='py-2 px-6'
            />
          </View>
        )}
      </Animated.View>
      <SheetModalSelect
        ref={autoDecaySheetRef}
        title='Auto decay'
        options={[{ value: 'slow' }, { value: 'moderate' }, { value: 'fast' }]}
        onSelect={setAutoDecay}
        value={autoDecay}
      />
    </>
  )
}
