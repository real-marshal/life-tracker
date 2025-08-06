import {
  addMonths,
  addWeeks,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns'
import { doesWeekStartWithMonday } from '@/common/utils/date'
import { LineChartData } from '@/components/LineChart/LineChart'

export const dateRanges = ['1M', '3M', '6M', '1Y', '2Y', 'ALL'] as const

export type DateRange = (typeof dateRanges)[number]

export const dateRangeDetailsMap: Record<
  DateRange,
  {
    label: string
    getRangeTimestamps: (data: LineChartData[]) => [number, number]
    getTickTimestamps?: (data: LineChartData[]) => number[]
    getLabel: (date: number) => string
  }
> = {
  '1M': {
    label: '1M',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(lastDate).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateWeekStart = startOfWeek(firstDate, {
        weekStartsOn: doesWeekStartWithMonday() ? 1 : 0,
      })

      const tickTimestamps: number[] = []

      let currentDateWeekStart = firstDateWeekStart
      while (currentDateWeekStart <= addWeeks(lastDate, 1)) {
        tickTimestamps.push(currentDateWeekStart.getTime())

        currentDateWeekStart = addWeeks(currentDateWeekStart, 1)
      }

      return tickTimestamps
    },
    getLabel: (date: number) => format(new Date(date), 'LLL d'),
  },
  '3M': {
    label: '3M',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subMonths(lastDate, 3)).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateWeekStart = startOfWeek(firstDate, {
        weekStartsOn: doesWeekStartWithMonday() ? 1 : 0,
      })

      const tickTimestamps: number[] = []

      let currentDateWeekStart = firstDateWeekStart
      while (currentDateWeekStart <= addWeeks(lastDate, 1)) {
        tickTimestamps.push(currentDateWeekStart.getTime())

        currentDateWeekStart = addWeeks(currentDateWeekStart, 2)
      }

      return tickTimestamps
    },
    getLabel: (date: number) => format(new Date(date), 'LLLLL d'),
  },
  '6M': {
    label: '6M',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subMonths(lastDate, 6)).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateMonthStart = startOfMonth(firstDate)

      const tickTimestamps: number[] = []

      let currentDateMonthStart = firstDateMonthStart
      while (currentDateMonthStart <= addMonths(lastDate, 1)) {
        tickTimestamps.push(currentDateMonthStart.getTime())

        currentDateMonthStart = addMonths(currentDateMonthStart, 1)
      }

      return tickTimestamps
    },
    getLabel: (date: number) => format(new Date(date), 'LLL'),
  },
  '1Y': {
    label: '1Y',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subYears(lastDate, 1)).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateMonthStart = startOfMonth(firstDate)

      const tickTimestamps: number[] = []

      let currentDateMonthStart = firstDateMonthStart
      while (currentDateMonthStart <= addMonths(lastDate, 1)) {
        tickTimestamps.push(currentDateMonthStart.getTime())

        currentDateMonthStart = addMonths(currentDateMonthStart, 1)
      }

      return tickTimestamps
    },
    getLabel: (date: number) => format(new Date(date), 'LLLLL'),
  },
  '2Y': {
    label: '2Y',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      const lastDate = new Date(data.at(-1)!.date)

      return [startOfMonth(subYears(lastDate, 2)).getTime(), lastDate.getTime()]
    },
    getTickTimestamps: (data) => {
      if (!data.length) return []

      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data.at(-1)!.date)

      const firstDateMonthStart = startOfMonth(firstDate)

      const tickTimestamps: number[] = []

      let currentDateMonthStart = firstDateMonthStart
      while (currentDateMonthStart <= addMonths(lastDate, 1)) {
        tickTimestamps.push(currentDateMonthStart.getTime())

        currentDateMonthStart = addMonths(currentDateMonthStart, 3)
      }

      return tickTimestamps
    },
    getLabel: (date: number) => format(new Date(date), 'LLL'),
  },
  ALL: {
    label: 'ALL',
    getRangeTimestamps: (data) => {
      if (!data.length) return [0, 0]

      return [new Date(data[0].date).getTime(), new Date(data.at(-1)!.date).getTime()]
    },
    getLabel: (date: number) => format(new Date(date), 'LLL d'),
  },
}
