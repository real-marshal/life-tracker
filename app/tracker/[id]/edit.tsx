import { Keyboard, Text, TextInput, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LinkedGoals } from '@/components/Tracker/LinkedGoals'
import { HistoricalData } from '@/components/Tracker/HistoricalData'
import { Expandable } from '@/components/Expandable'
import { useEffect, useState } from 'react'
import { AppButton } from '@/components/AppButton'
import {
  BaseTracker,
  DateTracker,
  getTracker,
  StatTracker,
  updateDateTracker,
  UpdateDateTrackerParam,
  updateStatTracker,
  UpdateStatTrackerParam,
} from '@/models/tracker'
import { cn } from '@/common/utils/css'
import RNDateTimePicker from '@react-native-community/datetimepicker'
import { isFuture } from 'date-fns'
import { showErrorToast } from '@/common/toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSQLiteContext } from 'expo-sqlite'
import { useErrorToasts } from '@/hooks/useErrorToasts'

// noinspection JSUnusedGlobalSymbols
export default function EditTrackerScreen() {
  const router = useRouter()
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { id: idString, type } = useLocalSearchParams()
  const id = Number.parseInt(idString as string)

  const { data: tracker, error: trackerLoadingError } = useQuery({
    queryKey: ['trackers', id],
    queryFn: () => getTracker(db, id),
  })
  const { mutate: updateTracker, error: updatingError } = useMutation({
    mutationFn: (param: UpdateStatTrackerParam | UpdateDateTrackerParam) =>
      type === 'stat'
        ? updateStatTracker(db, param as UpdateStatTrackerParam)
        : updateDateTracker(db, param as UpdateDateTrackerParam),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackers'] }),
  })

  useErrorToasts(
    {
      title: 'Error loading a tracker',
      errorData: trackerLoadingError,
    },
    {
      title: 'Error updating the tracker',
      errorData: updatingError,
    }
  )

  return (
    <Pressable onPress={() => Keyboard.dismiss()}>
      <View className='flex flex-col m-safe pt-3 pb-3 px-3 gap-6 min-h-screen'>
        <View className='flex flex-row gap-4 items-center'>
          <Pressable onPress={() => router.back()}>
            <Feather name='chevron-left' size={30} color={colors.fg} />
          </Pressable>
          <Text className='text-fg text-2xl flex-1'>Edit tracker</Text>
        </View>
        <View className='flex flex-col gap-4'>
          {tracker && <TrackerForm {...tracker} onSave={updateTracker} revertible />}
          <Expandable title='Historical data'>
            <HistoricalData trackerId={id} />
          </Expandable>
          <Expandable title='Linked goals'>
            <LinkedGoals trackerId={id} />
          </Expandable>
        </View>
      </View>
    </Pressable>
  )
}

function TrackerForm({
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

function DateInput({ date, setDate }: { date: Date; setDate: (newDate: Date) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <View className='flex flex-col gap-2'>
        <Text className='text-fgSecondary'>Date:</Text>
        <Pressable onPress={() => setIsOpen(true)}>
          <Text className='text-fg bg-bgTertiary rounded-md p-3'>
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </Pressable>
      </View>
      {isOpen && (
        <RNDateTimePicker
          value={date!}
          onChange={(_, newDate) => {
            setIsOpen(false)

            if (!newDate || newDate.getTime() === date.getTime()) return

            if (isFuture(newDate)) {
              setDate(newDate)
            } else {
              showErrorToast('Invalid date', 'Date should be in the future')
            }
          }}
          mode='date'
        />
      )}
    </>
  )
}
