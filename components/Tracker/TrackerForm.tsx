import { Text, TextInput, View } from 'react-native'

import { colors } from '@/common/theme'
import { useEffect, useState } from 'react'
import { AppButton } from '@/components/AppButton'
import {
  BaseTracker,
  DateTracker,
  StatTracker,
  UpdateDateTrackerParam,
  UpdateStatTrackerParam,
} from '@/models/tracker'
import { cn } from '@/common/utils/css'
import { DateInput } from '../DateInput'
import { showErrorToast } from '@/common/toast'

export function TrackerForm({
  id,
  name: passedName,
  type,
  prefix: passedPrefix,
  suffix: passedSuffix,
  date: passedDate,
  onSave,
  className,
  revertible,
}: Pick<BaseTracker, 'id' | 'name' | 'type'> &
  Partial<Pick<StatTracker, 'prefix' | 'suffix'> & Pick<DateTracker, 'date'>> & {
    onSave: (param: UpdateStatTrackerParam | UpdateDateTrackerParam) => void
    className?: string
    revertible?: boolean
  }) {
  const [name, setName] = useState(passedName)

  useEffect(() => {
    setName(passedName)
  }, [passedName])

  const [prefix, setPrefix] = useState(passedPrefix)

  useEffect(() => {
    setPrefix(passedPrefix)
  }, [passedPrefix])

  const [suffix, setSuffix] = useState(passedSuffix)

  useEffect(() => {
    setSuffix(passedSuffix)
  }, [passedSuffix])

  const [date, setDate] = useState(passedDate)

  useEffect(() => {
    setDate(passedDate)
  }, [passedDate])

  const [isChanged, setIsChanged] = useState(false)

  useEffect(() => {
    if (
      name !== passedName ||
      prefix !== passedPrefix ||
      suffix !== passedSuffix ||
      date !== passedDate
    ) {
      setIsChanged(true)
    } else {
      setIsChanged(false)
    }
  }, [date, name, passedDate, passedName, passedPrefix, passedSuffix, prefix, suffix])

  return (
    <View className={cn(`flex flex-col gap-4 p-4 bg-bgSecondary rounded-md`, className)}>
      <View className='flex flex-col gap-2'>
        <Text className='text-fgSecondary'>Name:</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          className='text-fg bg-bgTertiary px-3 rounded-md'
        />
      </View>
      {type === 'stat' ? (
        <View className='flex flex-row gap-4'>
          <View className='flex flex-col gap-2 flex-1'>
            <Text className='text-fgSecondary'>Prefix:</Text>
            <TextInput
              value={prefix}
              onChangeText={setPrefix}
              className='text-fg bg-bgTertiary px-3 rounded-md'
              maxLength={6}
            />
          </View>
          <View className='flex flex-col gap-2 flex-1'>
            <Text className='text-fgSecondary'>Suffix:</Text>
            <TextInput
              value={suffix}
              onChangeText={setSuffix}
              className='text-fg bg-bgTertiary px-3 rounded-md'
              maxLength={6}
            />
          </View>
        </View>
      ) : (
        <DateInput date={date!} setDate={setDate} />
      )}

      {isChanged && (
        <View className='flex flex-row gap-4 justify-end pt-4'>
          {revertible && (
            <AppButton
              text='Revert'
              onPress={() => {
                setName(passedName)
                setPrefix(passedPrefix)
                setSuffix(passedSuffix)
                setDate(passedDate)
              }}
              color={colors.fg}
              activeColor={colors.fgSecondary}
              className='py-2 px-6'
            />
          )}
          <AppButton
            text='Save'
            onPress={() => {
              if (!name) {
                return showErrorToast('Invalid name', `Name can't be empty`)
              }

              onSave(
                type === 'stat'
                  ? {
                      id,
                      name: name.trim(),
                      prefix: prefix?.trim(),
                      suffix: suffix?.trim(),
                    }
                  : {
                      id,
                      name: name.trim(),
                      date,
                    }
              )
            }}
            color={colors.positive}
            activeColor={colors.positiveActive}
            className='py-2 px-6'
          />
        </View>
      )}
    </View>
  )
}
