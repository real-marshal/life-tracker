import { useState } from 'react'
import { Text, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import RNDateTimePicker from '@react-native-community/datetimepicker'
import { isFuture } from 'date-fns'
import { showErrorToast } from '@/common/toast'

export function DateInput({ date, setDate }: { date: Date; setDate: (newDate: Date) => void }) {
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
