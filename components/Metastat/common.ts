import { decayMetaStat, MetaStat, MetaStatDecayData } from '@/models/metastat'
import { useSQLiteContext } from 'expo-sqlite'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { differenceInCalendarDays, isToday } from 'date-fns'
import { useErrorToasts } from '@/hooks/useErrorToasts'

export type MetaStatGain = 'small' | 'big'

export const metastatGains = {
  small: 1 / 32,
  big: 1 / 16,
} as const satisfies Record<MetaStatGain, number>

const autoDecayDetails = {
  slow: {
    daysUntilDecay: 14,
    decayValue: 1 / 64,
  },
  moderate: {
    daysUntilDecay: 7,
    decayValue: 1 / 32,
  },
  fast: {
    daysUntilDecay: 3,
    decayValue: 1 / 8,
  },
} as const satisfies Record<MetaStat['autoDecay'], unknown>

export function useMetastatsAutodecay(metastats: MetaStat[]) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { mutate: decayMetastatMutation, error: decayError } = useMutation({
    mutationFn: ({ id, value }: { id: number; value: number }) => decayMetaStat(db, id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metastats'] }),
  })

  useErrorToasts({ title: 'Auto decay error', errorData: decayError })

  useEffect(() => {
    metastats.forEach(({ id, decayData, autoDecay, name }) => {
      const decayValue = getDecayValue(autoDecay, decayData)

      decayValue && console.log(`Decaying ${name} for ${decayValue}`)

      decayValue && decayMetastatMutation({ id, value: decayValue })
    })
  }, [decayMetastatMutation, metastats])
}

export function getDecayValue(
  autoDecay: MetaStat['autoDecay'],
  { lastValueIncreaseDate, lastDecayDate }: MetaStatDecayData
): number | undefined {
  if (
    differenceInCalendarDays(new Date(), lastValueIncreaseDate) >
      autoDecayDetails[autoDecay].daysUntilDecay &&
    !isToday(lastDecayDate)
  ) {
    const daysToDecay =
      lastDecayDate > lastValueIncreaseDate
        ? differenceInCalendarDays(new Date(), lastDecayDate)
        : 1

    return autoDecayDetails[autoDecay].decayValue * daysToDecay
  }
}
